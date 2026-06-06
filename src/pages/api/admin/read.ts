import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';

export const prerender = false;

const ALLOWED_PREFIXES = [
  'src/data/post/',
  'src/data/product/',
  'src/data/pages/',
  'src/data/site/',
];

function isAllowedPath(path: string): boolean {
  if (!path.startsWith('src/data/')) return false;
  if (path.includes('..')) return false;
  if (/\.(md|mdx)$/i.test(path)) return true;
  if (/\.(ya?ml)$/i.test(path)) return true;
  return false;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const path = url.searchParams.get('path') ?? '';
  if (!isAllowedPath(path)) {
    return errorResponse('path must be under src/data/ and be .md/.mdx/.yaml/.yml', 400);
  }

  try {
    const res = await auth.ctx.github.readFile(path);
    if (/\.(ya?ml)$/i.test(path)) {
      const yamlMod = await import('js-yaml');
      const data = yamlMod.load(res.content) as Record<string, unknown>;
      return okResponse({ path, sha: res.sha, data, downloadUrl: res.downloadUrl });
    }
    return okResponse({ path, sha: res.sha, content: res.content, downloadUrl: res.downloadUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Read failed';
    return errorResponse(message, status === 404 ? 404 : 500);
  }
};
