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
  if (!body || typeof body !== 'object') return 'Invalid request format';
  const b = body as Record<string, unknown>;
  if (b.collection !== 'post' && b.collection !== 'product') return 'collection must be post or product';
  if (!b.frontmatter || typeof b.frontmatter !== 'object') return 'frontmatter is required';
  const fm = b.frontmatter as Record<string, unknown>;
  if (typeof fm.title !== 'string' || fm.title.trim().length === 0) return 'title is required';
  if (typeof b.body !== 'string') return 'body is required';
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
    return errorResponse('Invalid request format', 400);
  }
  const payload = validatePayload(body);
  if (typeof payload === 'string') return errorResponse(payload, 400);

  const prefix = payload.collection === 'post' ? 'src/data/post/' : 'src/data/product/';
  const titleSlug = slugify(payload.frontmatter.title as string);
  const filename = (payload.filename ?? `${titleSlug}.md`).replace(/^\/+/, '');
  if (!/^[A-Za-z0-9._-]+\.(md|mdx)$/.test(filename)) {
    return errorResponse('filename can only contain alphanumeric, ., _, - and must end with .md or .mdx', 400);
  }
  const fullPath = prefix + filename;

  const content = stringifyMarkdown(payload.frontmatter, payload.body);
  const message = payload.commitMessage ?? `Create ${payload.collection}: ${payload.frontmatter.title}`;

  try {
    const result = await auth.ctx.github.createFile(fullPath, content, message);
    return okResponse({ path: result.contentPath, sha: result.contentSha, commitUrl: result.commitUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Create failed';
    if (status === 422) {
      return errorResponse('File already exists, use a different filename or use update API', 422);
    }
    return errorResponse(message, status >= 400 && status < 600 ? status : 500);
  }
};
