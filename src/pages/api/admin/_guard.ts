import type { AstroCookies } from 'astro';
import type { GitHubClient } from '~/lib/github';
import { GitHubClient as GitHubClientClass } from '~/lib/github';
import { verifySessionToken } from '~/lib/auth';
import { readTokenFromCookies } from '~/lib/token-store';

export interface AdminContext {
  username: string;
  github: GitHubClient;
}

export function authorizeAdmin(cookies: AstroCookies):
  | { ok: true; ctx: AdminContext }
  | { ok: false; status: number; error: string } {
  const session = cookies.get('ks-admin-session')?.value;
  const verified = session ? verifySessionToken(session) : null;
  if (!verified) {
    return { ok: false, status: 401, error: 'Not logged in or session expired' };
  }

  const token = readTokenFromCookies(cookies);
  if (!token) {
    return { ok: false, status: 412, error: 'GitHub Token must be linked first' };
  }

  return { ok: true, ctx: { username: verified.username, github: new GitHubClientClass(token) } };
}

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ success: false, error: message, ...extra }, status);
}

export function okResponse(data: Record<string, unknown> = {}): Response {
  return jsonResponse({ success: true, ...data });
}
