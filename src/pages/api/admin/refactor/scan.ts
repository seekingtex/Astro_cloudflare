import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from '../_guard';
import { GitHubClient } from '~/lib/github';
import { scanFile, validateRule, shouldScanPath, type FileMatch, type RefactorRule, type ScanResult } from '~/lib/link-refactor';

export const prerender = false;

const MAX_FILE_BYTES = 1024 * 1024;

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid request format', 400); }
  const rule: RefactorRule = {
    oldUrl: typeof (body as any)?.oldUrl === 'string' ? (body as any).oldUrl.trim() : undefined,
    newUrl: typeof (body as any)?.newUrl === 'string' ? (body as any).newUrl.trim() : undefined,
    oldName: typeof (body as any)?.oldName === 'string' ? (body as any).oldName.trim() : undefined,
    newName: typeof (body as any)?.newName === 'string' ? (body as any).newName.trim() : undefined,
  };
  if (!rule.oldUrl && !rule.oldName) {
    rule.oldUrl = '';
    rule.newUrl = '';
  }
  const validationError = validateRule(rule);
  if (validationError) return errorResponse(validationError, 400);

  const client = auth.ctx.github;
  let tree: Array<{ path: string; sha: string; size: number; type: string }>;
  try {
    tree = await client.getRecursiveTree();
  } catch (e) {
    return errorResponse('Failed to read repository file tree: ' + (e instanceof Error ? e.message : 'unknown'), 500);
  }

  const targets = tree.filter((t) => shouldScanPath(t.path) && t.size <= MAX_FILE_BYTES);

  const files: FileMatch[] = [];
  let totalOccurrences = 0;

  const concurrency = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const idx = cursor++;
      const t = targets[idx];
      try {
        const f = await client.readFile(t.path);
        const m = scanFile(t.path, f.content, rule, f.sha);
        if (m) {
          files.push(m);
          totalOccurrences += m.occurrences;
        }
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 404) continue;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()));

  files.sort((a, b) => b.occurrences - a.occurrences);

  const result: ScanResult = { rule, files, totalOccurrences, fileCount: files.length };
  return okResponse(result as unknown as Record<string, unknown>);
};
