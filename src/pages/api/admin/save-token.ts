import type { APIRoute } from 'astro';
import { GitHubClient, GitHubRequestError } from '~/lib/github';
import { saveTokenCookie, clearTokenCookie } from '~/lib/token-store';
import { verifySessionToken } from '~/lib/auth';
import { jsonResponse, errorResponse } from './_guard';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get('ks-admin-session')?.value;
  const verified = session ? verifySessionToken(session) : null;
  if (!verified) {
    return errorResponse('Not logged in or session expired', 401);
  }

  let body: { token?: unknown; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse('Invalid request format', 400);
  }

  const action = body.action === 'clear' ? 'clear' : 'save';

  if (action === 'clear') {
    clearTokenCookie(cookies);
    return jsonResponse({ success: true, cleared: true });
  }

  if (typeof body.token !== 'string' || body.token.trim().length < 10) {
    return errorResponse('Please enter a valid GitHub Token', 400);
  }

  const token = body.token.trim();
  const client = new GitHubClient(token);

  try {
    const user = await client.verifyToken();
    const repoRes = await fetch('https://api.github.com/repos/theworkvigour/Astro_cloudflare', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'vectoflare-admin',
      },
    });
    if (!repoRes.ok) {
      return errorResponse('Token does not have access to theworkvigour/Astro_cloudflare repo', 400, {
        repoStatus: repoRes.status,
      });
    }
    saveTokenCookie(cookies, token);
    return jsonResponse({
      success: true,
      user: { login: user.login, name: user.name, avatarUrl: user.avatar_url },
    });
  } catch (err) {
    if (err instanceof GitHubRequestError) {
      const reason =
        err.status === 401
          ? 'Token invalid or expired'
          : err.status === 403
            ? 'Token insufficient permissions or rate limited'
            : `GitHub API error (${err.status})`;
      return errorResponse(reason, 400, { detail: err.detail });
    }
    const message = err instanceof Error ? err.message : 'Verification failed';
    return errorResponse(message, 500);
  }
};
