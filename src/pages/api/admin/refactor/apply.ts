import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, jsonResponse, okResponse } from '../_guard';
import { GitHubClient } from '~/lib/github';
import { applyRuleToText, type RefactorRule } from '~/lib/link-refactor';

export const prerender = false;

interface ApplyFileChange {
  path: string;
  oldUrl?: string;
  newUrl?: string;
  oldName?: string;
  newName?: string;
  sha: string;
}

interface ApplyRequest {
  changes: ApplyFileChange[];
  commitMessage?: string;
}

const SCAN_PATH_PREFIXES = ['src/data/post/', 'src/data/product/', 'src/data/pages/', 'src/data/site/'];

function isAllowedPath(path: string): boolean {
  if (!SCAN_PATH_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (path.startsWith('src/data/contact/')) return false;
  if (path.includes('..')) return false;
  return /\.(md|mdx|ya?ml|json)$/i.test(path);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid request format', 400); }
  const req = body as ApplyRequest;
  if (!Array.isArray(req?.changes) || req.changes.length === 0) {
    return errorResponse('changes array cannot be empty', 400);
  }
  for (const c of req.changes) {
    if (!c || typeof c.path !== 'string' || typeof c.sha !== 'string') return errorResponse('Each change must contain path and sha', 400);
    if (!isAllowedPath(c.path)) return errorResponse(`Invalid path: ${c.path}`, 400);
  }

  const client = auth.ctx.github;
  const results: Array<{ path: string; ok: boolean; sha?: string; commitUrl?: string; error?: string }> = [];

  for (const change of req.changes) {
    try {
      const file = await client.readFile(change.path);
      if (file.sha !== change.sha) {
        results.push({ path: change.path, ok: false, error: 'File modified by another user, please refresh and retry' });
        continue;
      }
      const rule: RefactorRule = {
        oldUrl: change.oldUrl,
        newUrl: change.newUrl,
        oldName: change.oldName,
        newName: change.newName,
      };
      const { text: newContent } = applyRuleToText(file.content, rule);
      if (newContent === file.content) {
        results.push({ path: change.path, ok: true, sha: file.sha });
        continue;
      }
      const baseMsg = (req.commitMessage || 'Refactor link/name').slice(0, 80);
      const subject =
        change.oldUrl && change.newUrl
          ? `${change.oldUrl} → ${change.newUrl}`
          : change.oldName && change.newName
            ? `${change.oldName} → ${change.newName}`
            : 'refactor';
      const message = `${baseMsg}: ${subject} (in ${change.path})`;
      const updated = await client.updateFile(change.path, newContent, file.sha, message);
      results.push({ path: change.path, ok: true, sha: updated.contentSha, commitUrl: updated.commitUrl });
    } catch (e) {
      const status = (e as { status?: number }).status;
      const msg = e instanceof Error ? e.message : 'unknown';
      if (status === 409 || status === 422) {
        results.push({ path: change.path, ok: false, error: 'File modified by another user, please refresh and retry' });
      } else {
        results.push({ path: change.path, ok: false, error: msg });
      }
    }
  }

  const allOk = results.every((r) => r.ok);
  return jsonResponse({ success: allOk, results, allOk }, allOk ? 200 : 207);
};
