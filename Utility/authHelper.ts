import * as fs from 'fs';
import { execSync } from 'child_process';

interface StorageState {
    cookies?: Array<{ name: string; value: string; domain?: string }>;
    origins?: Array<{
        origin: string;
        localStorage?: Array<{ name: string; value: string }>;
    }>;
}

// Matches a JWT: three base64url segments separated by dots, starting with "eyJ"
// (the base64-encoded "{" of the header). Works whether the token sits raw in
// localStorage or is nested inside a JSON blob like {"token":"eyJ..."} or a
// Redux-persist string with escaped quotes.
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/**
 * Pull the JWT out of a saved storageState file. Scans every localStorage
 * value across every origin for anything that matches the JWT shape — so it
 * works whether MCare stores the token as a bare string, wrapped in
 * `{"token":"..."}`, or buried inside a Redux-persist blob.
 *
 * If multiple JWTs are found (e.g. auth_token AND persist:root both carry
 * a copy), we pick the one with the latest `exp` — usually they're identical.
 */
export function extractBearerToken(storageStatePath: string): string {
    if (!fs.existsSync(storageStatePath)) {
        throw new Error(
            `Storage state not found at ${storageStatePath}. ` +
            `Run the login setup first: npx playwright test tests/mcare-login.setup.ts`
        );
    }
    const state: StorageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));

    const candidates: string[] = [];
    for (const origin of state.origins || []) {
        for (const entry of origin.localStorage || []) {
            const matches = entry.value?.match(JWT_PATTERN);
            if (matches) candidates.push(...matches);
        }
    }

    if (candidates.length === 0) {
        throw new Error(
            `No JWT found in ${storageStatePath}. ` +
            `Session may be stale — re-run the login setup.`
        );
    }

    // Prefer the token with the furthest-out expiry.
    candidates.sort((a, b) => {
        const ea = decodeJwtPayload(a)?.exp ?? 0;
        const eb = decodeJwtPayload(b)?.exp ?? 0;
        return eb - ea;
    });
    return candidates[0];
}

/** Decode a JWT payload without verifying signature. Used to check expiry. */
export function decodeJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        // base64url → base64 padding
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const json = Buffer.from(b64, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch { return null; }
}

/** Seconds until the token expires. Negative if already expired. */
export function secondsUntilExpiry(token: string): number {
    const p = decodeJwtPayload(token);
    if (!p?.exp) return -1;
    return p.exp - Math.floor(Date.now() / 1000);
}

/**
 * Re-run the login setup as a child process. Uses your existing project
 * config. Launches headed — if the MSO session is still alive at the
 * Microsoft/Optum level this completes silently in ~15s; if MFA is needed,
 * you approve it once and the API run resumes automatically.
 */
export function refreshLogin(setupTestFile: string): void {
    console.log(`\n[auth] refreshing via ${setupTestFile} ...`);
    execSync(`npx playwright test ${setupTestFile} --headed`, {
        stdio: 'inherit',
        timeout: 5 * 60 * 1000,
    });
    console.log('[auth] refresh complete\n');
}

/**
 * Serializes re-auth across concurrent workers. First worker to hit 401
 * triggers the refresh; the rest wait on the same promise.
 */
let refreshInFlight: Promise<void> | null = null;
export function refreshLoginOnce(setupTestFile: string): Promise<void> {
    if (!refreshInFlight) {
        refreshInFlight = new Promise<void>((resolve, reject) => {
            try {
                refreshLogin(setupTestFile);
                resolve();
            } catch (e) { reject(e); }
        }).finally(() => {
            setTimeout(() => { refreshInFlight = null; }, 1000);
        });
    }
    return refreshInFlight;
}