import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { stringifyMarkdown } from '~/lib/markdown';

export const prerender = false;

interface UpdatePayload {
  path: string;
  sha: string;
  frontmatter: Record<string, unknown>;
  body: string;
  commitMessage?: string;
}

function isAllowedPath(path: string): boolean {
  if (!path.startsWith('src/data/')) return false;
  if (!/\.(md|mdx)$/i.test(path)) return false;
  if (path.includes('..')) return false;
  return true;
}

function validatePayload(body: unknown): UpdatePayload | string {
  if (!body || typeof body !== 'object') return '请求格式错误';
  const b = body as Record<string, unknown>;
  if (typeof b.path !== 'string') return 'path 必填';
  if (!isAllowedPath(b.path)) return 'path 必须在 src/data/ 下且为 .md/.mdx';
  if (typeof b.sha !== 'string' || b.sha.length === 0) return 'sha 必填(防冲突)';
  if (!b.frontmatter || typeof b.frontmatter !== 'object') return 'frontmatter 必填';
  if (typeof b.body !== 'string') return 'body 必填';
  return {
    path: b.path,
    sha: b.sha,
    frontmatter: b.frontmatter as Record<string, unknown>,
    body: b.body as string,
    commitMessage: typeof b.commitMessage === 'string' ? b.commitMessage : undefined,
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('请求格式错误', 400);
  }
  const payload = validatePayload(body);
  if (typeof payload === 'string') return errorResponse(payload, 400);

  const content = stringifyMarkdown(payload.frontmatter, payload.body);
  const title = (payload.frontmatter.title as string) ?? payload.path;
  const message = payload.commitMessage ?? `Update ${payload.path.split('/').pop()}: ${title}`;

  try {
    const result = await auth.ctx.github.updateFile(payload.path, content, payload.sha, message);
    return okResponse({ path: result.contentPath, sha: result.contentSha, commitUrl: result.commitUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : '更新失败';
    if (status === 409 || status === 422) {
      return errorResponse('文件已被其他人修改,请刷新后重试', 409);
    }
    return errorResponse(message, status >= 400 && status < 600 ? status : 500);
  }
};
