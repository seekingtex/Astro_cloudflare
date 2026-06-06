import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';

export const prerender = false;

function isAllowedPath(path: string): boolean {
  if (!path.startsWith('src/data/')) return false;
  if (!/\.(md|mdx)$/i.test(path)) return false;
  if (path.includes('..')) return false;
  return true;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: { path?: string; sha?: string; commitMessage?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse('Invalid request format', 400);
  }
  if (typeof body.path !== 'string' || !isAllowedPath(body.path)) {
    return errorResponse('path must be under src/data/ and be .md/.mdx', 400);
  }
  if (typeof body.sha !== 'string' || body.sha.length === 0) {
    return errorResponse('sha is required (prevents accidental deletion)', 400);
  }

  const name = body.path.split('/').pop() ?? body.path;
  const message = body.commitMessage ?? `Delete ${name}`;

  try {
    const result = await auth.ctx.github.deleteFile(body.path, body.sha, message);
    return okResponse({ path: body.path, commitSha: result.commitSha, commitUrl: result.commitUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Delete failed';
    return errorResponse(message, status >= 400 && status < 600 ? status : 500);
  }
};
