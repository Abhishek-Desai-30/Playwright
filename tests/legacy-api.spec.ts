import { test, request, APIRequestContext } from '@playwright/test';
import {
    readCsv, ensureOutputHeader, loadDoneKeys, appendRow, nowStamp,
    resolveRunOutput, clearRunMarker, pruneRuns,
} from '../Utility/csvHelper';
import { refreshLoginOnce } from '../Utility/authHelper';
import * as path from 'path';

// ---------- Config ----------
const STORAGE_STATE   = '.auth/user.json';
const SETUP_TEST_FILE = 'tests/login.setup.ts';
const INPUT_CSV       = path.join('test-data', 'InputE.csv');
const OUTPUT_DIR      = 'test-data';
const OUTPUT_PREFIX   = 'OutputE';        // → OutputE_DD-MMM-YYYY HH-MM-SS.csv
const API_BASE        = process.env.BASE_URL;
const API_PATH        = '/FormInstance/GetContractNumberCount';
const CONCURRENCY     = 10;
const REQUEST_TIMEOUT = 60_000;
const OUTPUT_HEADERS  = [
    'Timestamp', 'HTTPStatus', 'Status', 'ruleID', 'rowVersion', 'key',
    'networkType', 'effectiveStartDatePlanYear', 'EstimatedPlanHit',
    'RawMessage', 'ItemStatus', 'Result', 'error',
];
// ----------------------------

test.describe.configure({ mode: 'serial' });

test('Legacy Estimated Plan Hit Check - bulk', async () => {
    test.setTimeout(0);

    const rows = readCsv(INPUT_CSV);

    const OUTPUT_CSV = resolveRunOutput(OUTPUT_DIR, OUTPUT_PREFIX);
    ensureOutputHeader(OUTPUT_CSV, OUTPUT_HEADERS);

    const rowKey = (r: Record<string, string>) =>
        `${r.ruleID}|${r.rowVersion}|${r.key}|${r.networkType}|${r.effectiveStartDatePlanYear}`;
    const done = loadDoneKeys(OUTPUT_CSV, rowKey);
    const queue = rows.filter(r => !done.has(rowKey(r)));

    console.log(`[legacy] total=${rows.length} done=${done.size} pending=${queue.length}`);
    if (queue.length === 0) {
        console.log('[legacy] nothing to do');
        clearRunMarker(OUTPUT_DIR, OUTPUT_PREFIX);
        return;
    }

    let ctx: APIRequestContext = await buildContext();
    async function rebuild() {
        try { await ctx.dispose(); } catch { /* ignore */ }
        ctx = await buildContext();
    }

    let processed = 0;
    const total = queue.length;
    const startedAt = Date.now();

    const worker = async () => {
        while (queue.length) {
            const row = queue.shift();
            if (!row) break;

            for (let attempt = 1; attempt <= 3; attempt++) {
                const result = await callOne(ctx, row);

                const looksUnauth =
                    result.httpStatus === 401 ||
                    result.httpStatus === 403 ||
                    (typeof result.error === 'string' &&
                     result.error.toLowerCase().includes('sign in'));

                if (looksUnauth && attempt < 3) {
                    await refreshLoginOnce(SETUP_TEST_FILE);
                    await rebuild();
                    continue;
                }
                if (typeof result.httpStatus === 'number' &&
                    result.httpStatus >= 500 && attempt < 3) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                    continue;
                }

                await appendRow(OUTPUT_CSV, [
                    nowStamp(), result.httpStatus, result.status,
                    row.ruleID, row.rowVersion, row.key, row.networkType,
                    row.effectiveStartDatePlanYear,
                    result.estimatedHit, result.rawMessage,
                    result.itemStatus, result.result, result.error,
                ]);
                break;
            }

            processed++;
            if (processed % 25 === 0 || processed === total) {
                const secs = (Date.now() - startedAt) / 1000;
                const rate = processed / secs;
                const eta = Math.round((total - processed) / rate);
                console.log(`[legacy] ${processed}/${total}  rate=${rate.toFixed(1)}/s  eta=${eta}s`);
            }
        }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    await ctx.dispose();
    clearRunMarker(OUTPUT_DIR, OUTPUT_PREFIX);
    pruneRuns(OUTPUT_DIR, OUTPUT_PREFIX, 10);   // keep newest 10 runs per day
    console.log(`[legacy] done in ${Math.round((Date.now() - startedAt) / 1000)}s → ${path.basename(OUTPUT_CSV)}`);
});

// ---------- Helpers ----------

async function buildContext(): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: API_BASE,
        storageState: STORAGE_STATE,
        extraHTTPHeaders: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': '*/*',
        },
        timeout: REQUEST_TIMEOUT,
    });
}

interface LegacyResult {
    httpStatus: number | string;
    status: 'SUCCESS' | 'FAILED';
    estimatedHit: string;
    rawMessage: string;
    itemStatus: string;
    result: string;
    error: string;
}

async function callOne(
    ctx: APIRequestContext,
    row: Record<string, string>
): Promise<LegacyResult> {
    const form = {
        effectiveStartDatePlanYear: row.effectiveStartDatePlanYear,
        networkType: row.networkType,
        ruleID: row.ruleID,
        rowVersion: row.rowVersion,
        key: row.key,
    };
    try {
        const res = await ctx.post(API_PATH, { form });
        const httpStatus = res.status();
        const text = await res.text();

        if (httpStatus === 401 || httpStatus === 403) return blank(httpStatus, 'Unauthorized');
        if (text.trim().startsWith('<')) return blank(httpStatus, 'Got HTML — session likely expired');
        if (!res.ok()) return blank(httpStatus, text.slice(0, 500));

        let json: any;
        try { json = JSON.parse(text); }
        catch { return blank(httpStatus, 'Non-JSON response'); }

        let estimatedHit = '';
        let rawMessage = '';
        let itemStatus = '';
        const result = json.Result != null ? String(json.Result) : '';

        if (Array.isArray(json.Items) && json.Items.length > 0) {
            const item = json.Items[0];
            if (item.Status != null) itemStatus = String(item.Status);
            if (Array.isArray(item.Messages)) {
                rawMessage = item.Messages.join(' | ');
                for (const m of item.Messages) {
                    if (typeof m === 'string' && m.includes('Estimated Plan Hit')) {
                        const mm = m.match(/(\d+)/);
                        if (mm) estimatedHit = mm[1];
                    }
                }
            }
        }

        return {
            httpStatus,
            status: estimatedHit !== '' ? 'SUCCESS' : 'FAILED',
            estimatedHit, rawMessage, itemStatus, result, error: '',
        };
    } catch (e: any) {
        return blank('ERR', `Exception: ${e.message ?? e}`);
    }
}

function blank(httpStatus: number | string, error: string): LegacyResult {
    return { httpStatus, status: 'FAILED', estimatedHit: '', rawMessage: '', itemStatus: '', result: '', error };
}