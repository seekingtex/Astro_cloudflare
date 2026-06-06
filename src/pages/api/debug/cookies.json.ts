import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('ks-admin-session')?.value ?? null;
  const gh = cookies.get('keystatic-gh-access-token')?.value ?? null;
  return new Response(
    JSON.stringify({
      ksAdminSession: session ? `${session.slice(0, 8)}... (${session.length} chars)` : null,
      keystaticGhAccessToken: gh ? `${gh.slice(0, 4)}... (${gh.length} chars)` : null,
      allCookieNames: (typeof cookies.get === 'function'
        ? ['ks-admin-session', 'keystatic-gh-access-token'].map((n) => ({ name: n, present: !!cookies.get(n)?.value }))
        : []),
    }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
