import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { slugify } from '~/lib/github';
import { stringifyMarkdown } from '~/lib/markdown';

export const prerender = false;

interface CreatePayload {
  collection: 'post' | 'product';
  filename?: string;
  frontmatter: Record<string, unknown>;
  body: string;
  commitMessage?: string;
}

function validatePayload(body: unknown): CreatePayload | string {
  if (!body || typeof body !== 'object') return '请求格式错误';
  const b = body as Record<string, unknown>;
  if (b.collection !== 'post' && b.collection !== 'product') return 'collection 必须是 post 或 product';
  if (!b.frontmatter || typeof b.frontmatter !== 'object') return 'frontmatter 必填';
  const fm = b.frontmatter as Record<string, unknown>;
  if (typeof fm.title !== 'string' || fm.title.trim().length === 0) return 'title 必填';
  if (typeof b.body !== 'string') return 'body 必填';
  return {
    collection: b.collection,
    filename: typeof b.filename === 'string' ? b.filename : undefined,
    frontmatter: fm,
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

  const prefix = payload.collection === 'post' ? 'src/data/post/' : 'src/data/product/';
  const titleSlug = slugify(payload.frontmatter.title as string);
  const filename = (payload.filename ?? `${titleSlug}.md`).replace(/^\/+/, '');
  if (!/^[A-Za-z0-9._-]+\.(md|mdx)$/.test(filename)) {
    return errorResponse('filename 只能包含字母数字、._- 且必须以 .md 或 .mdx 结尾', 400);
  }
  const fullPath = prefix + filename;

  const content = stringifyMarkdown(payload.frontmatter, payload.body);
  const message = payload.commitMessage ?? `Create ${payload.collection}: ${payload.frontmatter.title}`;

  try {
    const result = await auth.ctx.github.createFile(fullPath, content, message);
    return okResponse({ path: result.contentPath, sha: result.contentSha, commitUrl: result.commitUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : '创建失败';
    if (status === 422) {
      return errorResponse('文件已存在,请换一个文件名或使用 update 接口', 422);
    }
    return errorResponse(message, status >= 400 && status < 600 ? status : 500);
  }
};
