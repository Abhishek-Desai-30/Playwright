import { test, request, APIRequestContext } from '@playwright/test';
import * as path from 'path';
import {
    readCsv, ensureOutputHeader, loadDoneKeys, appendRow, nowStamp,
    resolveRunOutput, clearRunMarker, pruneRuns,
} from '../Utility/csvHelper';
import {
    extractBearerToken, secondsUntilExpiry, refreshLoginOnce,
} from '../Utility/authHelper';

function requireEnv(name: string): string {
    const env: string | undefined = process.env[name];
    if (!env) {
        throw new Error(
            `Missing env var ${name} - check .env.${process.env.MCARE_URL ?? '<MCARE ENV not set>'}`
        );
    }
    return env.replace(/\/+$/, '');
}

function deriveApiBase(): string {
    const spa = requireEnv('MCARE_URL');
    return spa.replace('mcare-', 'mcare-eligibilityapi-');
}

// ---------- Config ----------
const STORAGE_STATE   = '.auth/mcare-user.json';
const SETUP_TEST_FILE = 'tests/mcare-login.setup.ts';
const INPUT_CSV       = path.join('test-data', 'InputP.csv');
const OUTPUT_DIR      = 'test-data';
const OUTPUT_PREFIX   = 'OutputP';        // -> OutputP_DD-MMM-YYYY HH-MM-SS.csv
const API_BASE        = deriveApiBase();
const API_PATH        = '/api/Rule/PlansEffectedByRuleKey';
const CURRENT_ROLE    = 'Simplify SuperUser';
const CONCURRENCY     = 15;                // parallel workers
const REQUEST_TIMEOUT = 60_000;           // per-call timeout in ms
const RUNS_PER_DAY    = 10;                // keep newest N runs per calendar day
const OUTPUT_HEADERS  = [
    'Timestamp', 'HTTPStatus', 'Status', 'key', 'year', 'networkType',
    'totalRecords', 'individual', 'group', 'error',
];
// ----------------------------

test.describe.configure({ mode: 'serial' });

test('MCare Plan Count Check - bulk', async () => {
    test.setTimeout(0); // unpredictable runtime, no cap

    console.log(`[mcare] API base: ${API_BASE}`);

    const rows = readCsv(INPUT_CSV);

    // Pick this run's output file: fresh timestamped name, or resume a crash.
    const OUTPUT_CSV = resolveRunOutput(OUTPUT_DIR, OUTPUT_PREFIX);
    ensureOutputHeader(OUTPUT_CSV, OUTPUT_HEADERS);

    const rowKey = (r: Record<string, string>) =>
        `${r.key}|${r.year}|${r.networkType}`;
    const done = loadDoneKeys(OUTPUT_CSV, rowKey);
    const queue = rows.filter(r => !done.has(rowKey(r)));

    console.log(`[mcare] total=${rows.length} done=${done.size} pending=${queue.length}`);
    if (queue.length === 0) {
        console.log('[mcare] nothing to do');
        clearRunMarker(OUTPUT_DIR, OUTPUT_PREFIX);
        return;
    }

    // -- Build the shared request context using the current token --
    let token = extractBearerToken(STORAGE_STATE);
    let ctx: APIRequestContext = await buildContext(token);

    /** Rebuild the request context after a token refresh. */
    async function rebuild() {
        try { await ctx.dispose(); } catch { /* ignore */ }
        token = extractBearerToken(STORAGE_STATE);
        ctx = await buildContext(token);
    }

    // Warn early if the token is about to expire -- saves a wasted 401 round-trip.
    const secsLeft = secondsUntilExpiry(token);
    console.log(`[mcare] token expires in ~${Math.round(secsLeft / 60)} min`);
    if (secsLeft > 0 && secsLeft < 120) {
        console.log('[mcare] token nearly expired, refreshing preemptively');
        await refreshLoginOnce(SETUP_TEST_FILE);
        await rebuild();
    }

    // -- Worker loop --
    let processed = 0;
    const total = queue.length;
    const startedAt = Date.now();

    const worker = async (id: number) => {
        while (queue.length) {
            const row = queue.shift();
            if (!row) break;

            for (let attempt = 1; attempt <= 3; attempt++) {
                const result = await callOne(ctx, row);

                // Refresh + retry on expired token.
                if (result.httpStatus === 401 && attempt < 3) {
                    // Only one worker refreshes; the others wait on the same promise.
                    await refreshLoginOnce(SETUP_TEST_FILE);
                    await rebuild();
                    continue; // retry with fresh token
                }
                // Back off + retry on transient server 5xx.
                if (typeof result.httpStatus === 'number' &&
                    result.httpStatus >= 500 && attempt < 3) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                    continue;
                }

                await appendRow(OUTPUT_CSV, [
                    nowStamp(), result.httpStatus, result.status,
                    row.key, row.year, row.networkType,
                    result.totalRecords, result.individual, result.group,
                    result.error,
                ]);
                break;
            }

            processed++;
            if (processed % 25 === 0 || processed === total) {
                const secs = (Date.now() - startedAt) / 1000;
                const rate = processed / secs;
                const eta = Math.round((total - processed) / rate);
                console.log(
                    `[mcare] ${processed}/${total}  ` +
                    `rate=${rate.toFixed(1)}/s  eta=${eta}s`
                );
            }
        }
    };

    await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) => worker(i))
    );

    await ctx.dispose();
    clearRunMarker(OUTPUT_DIR, OUTPUT_PREFIX);          // clean finish -> next run gets a new dated file
    pruneRuns(OUTPUT_DIR, OUTPUT_PREFIX, RUNS_PER_DAY); // keep newest N runs per day
    console.log(`[mcare] done in ${Math.round((Date.now() - startedAt) / 1000)}s -> ${path.basename(OUTPUT_CSV)}`);
});

// ---------- Helpers ----------

async function buildContext(token: string): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: API_BASE,
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'current-role': CURRENT_ROLE,
            'Accept': 'application/json, text/plain, */*',
        },
        timeout: REQUEST_TIMEOUT,
    });
}

interface CallResult {
    httpStatus: number | string;
    status: 'SUCCESS' | 'FAILED';
    totalRecords: string;
    individual: string;
    group: string;
    error: string;
}

async function callOne(
    ctx: APIRequestContext,
    row: Record<string, string>
): Promise<CallResult> {
    const body = {
        key: row.key,
        year: row.year,
        networkType: row.networkType,
        tenantId: 2,
    };
    try {
        const res = await ctx.post(API_PATH, { data: body });
        const httpStatus = res.status();
        const text = await res.text();

        if (httpStatus === 401) {
            return { httpStatus, status: 'FAILED', totalRecords: '',
                individual: '', group: '', error: 'Unauthorized (token expired)' };
        }
        if (!res.ok()) {
            return { httpStatus, status: 'FAILED', totalRecords: '',
                individual: '', group: '', error: text.slice(0, 500) };
        }

        let json: any;
        try { json = JSON.parse(text); }
        catch { return { httpStatus, status: 'FAILED', totalRecords: '',
            individual: '', group: '', error: 'Non-JSON response' }; }

        return {
            httpStatus,
            status: json.totalRecords != null ? 'SUCCESS' : 'FAILED',
            totalRecords: json.totalRecords?.toString() ?? '',
            individual:   json.individual?.toString()   ?? '',
            group:        json.group?.toString()        ?? '',
            error: '',
        };
    } catch (e: any) {
        return { httpStatus: 'ERR', status: 'FAILED', totalRecords: '',
            individual: '', group: '', error: `Exception: ${e.message ?? e}` };
    }
}