import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { stringifyMarkdown } from '~/lib/markdown';

export const prerender = false;

interface UpdateMarkdownPayload {
  format: 'markdown';
  path: string;
  sha: string;
  frontmatter: Record<string, unknown>;
  body: string;
  commitMessage?: string;
}

interface UpdateYamlPayload {
  format: 'yaml';
  path: string;
  sha: string;
  data: Record<string, unknown>;
  commitMessage?: string;
}

type UpdatePayload = UpdateMarkdownPayload | UpdateYamlPayload;

function isAllowedPath(path: string): boolean {
  if (!path.startsWith('src/data/')) return false;
  if (path.includes('..')) return false;
  if (/\.(md|mdx)$/i.test(path)) return true;
  if (/\.(ya?ml)$/i.test(path)) return true;
  return false;
}

function validatePayload(body: unknown): UpdatePayload | string {
  if (!body || typeof body !== 'object') return 'Invalid request format';
  const b = body as Record<string, unknown>;
  if (typeof b.path !== 'string') return 'path is required';
  if (!isAllowedPath(b.path)) return 'path must be under src/data/ and be .md/.mdx/.yaml/.yml';
  if (typeof b.sha !== 'string' || b.sha.length === 0) return 'sha is required (conflict prevention)';

  if (b.format === 'yaml' || /\.(ya?ml)$/i.test(b.path)) {
    if (!b.data || typeof b.data !== 'object') return 'data is required (YAML mode)';
    return {
      format: 'yaml',
      path: b.path,
      sha: b.sha,
      data: b.data as Record<string, unknown>,
      commitMessage: typeof b.commitMessage === 'string' ? b.commitMessage : undefined,
    };
  }

  if (!b.frontmatter || typeof b.frontmatter !== 'object') return 'frontmatter is required';
  if (typeof b.body !== 'string') return 'body is required';
  return {
    format: 'markdown',
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
    return errorResponse('Invalid request format', 400);
  }
  const payload = validatePayload(body);
  if (typeof payload === 'string') return errorResponse(payload, 400);

  let content: string;
  let defaultMessage: string;
  if (payload.format === 'yaml') {
    const yamlMod = await import('js-yaml');
    content = yamlMod.dump(payload.data, { lineWidth: 120, noRefs: true, sortKeys: false });
    defaultMessage = `Update ${payload.path.split('/').pop()}`;
  } else {
    content = stringifyMarkdown(payload.frontmatter, payload.body);
    const title = (payload.frontmatter.title as string) ?? payload.path;
    defaultMessage = `Update ${payload.path.split('/').pop()}: ${title}`;
  }
  const message = payload.commitMessage ?? defaultMessage;

  try {
    const result = await auth.ctx.github.updateFile(payload.path, content, payload.sha, message);
    return okResponse({ path: result.contentPath, sha: result.contentSha, commitUrl: result.commitUrl });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Update failed';
    if (status === 409 || status === 422) {
      return errorResponse('File modified by another user, please refresh and retry', 409);
    }
    return errorResponse(message, status >= 400 && status < 600 ? status : 500);
  }
};
