import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse a single CSV line. Handles quoted fields with embedded commas and
 * escaped quotes (""). Covers what JMeter writes and your input files.
 */
export function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
            if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (c === '"') { inQ = false; }
            else { cur += c; }
        } else {
            if (c === ',') { out.push(cur); cur = ''; }
            else if (c === '"') { inQ = true; }
            else { cur += c; }
        }
    }
    out.push(cur);
    return out;
}

/** Read a CSV into an array of objects using the header row as keys. */
export function readCsv(filePath: string): Record<string, string>[] {
    const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const lines = text.split('\n').filter(l => l.length > 0);
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map(line => {
        const cells = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
        return row;
    });
}

/** Quote one CSV field the same way JMeter's Groovy did. */
export function csvField(v: unknown): string {
    if (v === null || v === undefined) return '""';
    return '"' + String(v).replace(/"/g, '""') + '"';
}

/** Ensure the output file exists with a header row. */
export function ensureOutputHeader(filePath: string, headers: string[]): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        fs.writeFileSync(filePath, headers.map(csvField).join(',') + '\r\n', 'utf8');
    }
}

/**
 * Build a Set of composite keys that identify rows already SUCCESS in the
 * output. Used to skip work when resuming after a crash.
 */
export function loadDoneKeys(
    filePath: string,
    keyBuilder: (row: Record<string, string>) => string
): Set<string> {
    const done = new Set<string>();
    if (!fs.existsSync(filePath)) return done;
    const rows = readCsv(filePath);
    for (const r of rows) {
        if (r['Status'] === 'SUCCESS') done.add(keyBuilder(r));
    }
    return done;
}

/**
 * Append a row. Writes are serialized through a promise chain so concurrent
 * workers don't interleave partial lines.
 */
let writeChain: Promise<void> = Promise.resolve();
export function appendRow(filePath: string, cells: unknown[]): Promise<void> {
    const line = cells.map(csvField).join(',') + '\r\n';
    writeChain = writeChain.then(() => new Promise<void>((res, rej) => {
        fs.appendFile(filePath, line, 'utf8', err => err ? rej(err) : res());
    }));
    return writeChain;
}

/** Timestamp inside CSV cells (unchanged from JMeter format). */
export function nowStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// Timestamped output filenames + crash-resume marker
// ---------------------------------------------------------------------------

/**
 * Windows-safe run stamp: "DD-MMM-YYYY HH-MM-SS".
 * Colons are illegal in Windows filenames, so time uses dashes.
 */
export function formatFileStamp(d: Date = new Date()): string {
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${MON[d.getMonth()]}-${d.getFullYear()} ` +
           `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

/**
 * Decide which output file this run writes to.
 *
 *  - If a marker file (.<prefix>-current) points to an existing file, we're
 *    resuming a crashed run → return that same file so loadDoneKeys can skip
 *    already-completed rows.
 *  - Otherwise start a NEW timestamped file and record it in the marker.
 *
 * Call clearRunMarker() once the run finishes cleanly so the next run starts
 * a fresh dated file (giving you one file per completed run to compare).
 *
 * @param dir     folder for outputs, e.g. 'test-data'
 * @param prefix  filename prefix, e.g. 'OutputP' or 'OutputE'
 */
export function resolveRunOutput(dir: string, prefix: string): string {
    fs.mkdirSync(dir, { recursive: true });
    const marker = path.join(dir, `.${prefix}-current`);

    if (fs.existsSync(marker)) {
        const active = fs.readFileSync(marker, 'utf8').trim();
        if (active && fs.existsSync(active)) {
            console.log(`[resume] continuing incomplete run → ${path.basename(active)}`);
            return active;
        }
    }

    const file = path.join(dir, `${prefix}_${formatFileStamp()}.csv`);
    fs.writeFileSync(marker, file, 'utf8');
    console.log(`[new run] output → ${path.basename(file)}`);
    return file;
}

/** Remove the resume marker after a clean finish. */
export function clearRunMarker(dir: string, prefix: string): void {
    const marker = path.join(dir, `.${prefix}-current`);
    if (fs.existsSync(marker)) fs.unlinkSync(marker);
}

/**
 * Per-day retention. Groups output files by the DD-MMM-YYYY portion of their
 * name and, within each day, keeps only the newest `perDayCap` runs — deleting
 * older ones. Days are independent, so yesterday and today each keep up to 10.
 *
 * Only touches files named exactly "<prefix>_DD-MMM-YYYY HH-MM-SS.csv", so
 * input files, the other app's output, and the marker are never affected.
 *
 * @param dir        folder to scan, e.g. 'test-data'
 * @param prefix     'OutputP' or 'OutputE'
 * @param perDayCap  max files to keep per calendar day (default 10)
 */
export function pruneRuns(dir: string, prefix: string, perDayCap = 10): void {
    if (!fs.existsSync(dir)) return;

    const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
        `^${esc}_(\\d{2}-[A-Za-z]{3}-\\d{4}) (\\d{2}-\\d{2}-\\d{2})\\.csv$`
    );

    // day (DD-MMM-YYYY) -> list of { file, time }
    const byDay = new Map<string, Array<{ file: string; time: string }>>();
    for (const name of fs.readdirSync(dir)) {
        const m = name.match(re);
        if (!m) continue;
        const [, day, time] = m;
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push({ file: path.join(dir, name), time });
    }

    for (const [, files] of byDay) {
        if (files.length <= perDayCap) continue;
        // newest first (HH-MM-SS is zero-padded, so string compare is chronological)
        files.sort((a, b) => b.time.localeCompare(a.time));
        for (const f of files.slice(perDayCap)) {
            try {
                fs.unlinkSync(f.file);
                console.log(`[prune] removed ${path.basename(f.file)}`);
            } catch { /* ignore */ }
        }
    }
}