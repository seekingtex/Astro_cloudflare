import crypto from 'node:crypto';

const COOKIE_NAME = 'ks-gh-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSecretKey(): Buffer {
  const raw =
    (import.meta.env as Record<string, string | undefined>).SESSION_SECRET ||
    (import.meta.env as Record<string, string | undefined>).KEYSTATIC_SECRET ||
    'fallback-dev-secret-do-not-use-in-prod-32chars';
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptToken(plain: string): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function decryptToken(blob: string): string | null {
  try {
    const key = getSecretKey();
    const buf = Buffer.from(blob, 'base64url');
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const enc = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf-8');
  } catch {
    return null;
  }
}

export function saveTokenCookie(
  cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void },
  token: string,
): void {
  cookies.set(COOKIE_NAME, encryptToken(token), {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearTokenCookie(cookies: {
  delete: (name: string, opts: Record<string, unknown>) => void;
}): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function readTokenFromCookies(cookies: { get: (name: string) => { value: string } | undefined }): string | null {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decryptToken(raw);
}

export const TOKEN_COOKIE_NAME = COOKIE_NAME;
