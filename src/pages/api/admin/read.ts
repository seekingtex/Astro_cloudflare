import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';

export const prerender = false;

function isAllowedPath(path: string): boolean {
  if (!path.startsWith('src/data/')) return false;
  if (!/\.(md|mdx)$/i.test(path)) return false;
  if (path.includes('..')) return false;
  return true;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const path = url.searchParams.get('path') ?? '';
  if (!isAllowedPath(path)) {
    return errorResponse('path 必须在 src/data/ 下且为 .md/.mdx', 400);
  }

  try {
    const res = await auth.ctx.github.readFile(path);
    return okResponse({ path, sha: res.sha, content: res.content, downloadUrl: res.downloadUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : '读取失败';
    return errorResponse(message, status === 404 ? 404 : 500);
  }
};
