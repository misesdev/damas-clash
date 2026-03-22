import {BASE_URL} from './client';

export const APP_VERSION = '2.9';

/** Zapstore deep link for the app */
export const ZAPSTORE_URL = 'zapstore://install?app=com.damasclash';
/** Zapstore web page fallback if the deep link fails */
export const ZAPSTORE_WEB_URL = 'https://zapstore.dev/apps/com.damasclash';
/** Direct APK download from the latest GitHub Release */
export const GITHUB_APK_URL = 'https://github.com/misesdev/damas-clash/releases/latest';

/**
 * Fetches the minimum required version from the API.
 * Returns null on network error — caller should treat null as "no update required"
 * so a temporary connectivity issue never blocks the user.
 */
export async function fetchMinVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/app/version`);
    if (!res.ok) {return null;}
    const json = await res.json();
    return typeof json.minVersion === 'string' ? json.minVersion : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if `current` is strictly older than `required`.
 * Supports semver-like strings with any number of dot-separated parts (e.g. "2.7", "2.7.1").
 */
export function isVersionOutdated(current: string, required: string): boolean {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const cur = parse(current);
  const req = parse(required);
  const len = Math.max(cur.length, req.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const r = req[i] ?? 0;
    if (c < r) {return true;}
    if (c > r) {return false;}
  }
  return false;
}
