import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { GitHubClient } from '~/lib/github';
import { shouldScanPath } from '~/lib/link-refactor';

export const prerender = false;

const STATIC_PAGES = new Set(['/', '/about', '/services', '/pricing', '/contact', '/news', '/products', '/terms', '/privacy', '/keystatic', '/login', '/rss.xml', '/sitemap-index.xml', '/search-index.json']);
const PAGE_SLUG_RE = /^\/(blog|products|category|tag)\/[^/?#]+/;

const HREF_PATTERNS: RegExp[] = [
  /href:\s*["']?([^"'\s#]+)(?:#[^"'\s]*)?["']?/g,
  /url:\s*["']?([^"'\s#]+)(?:#[^"'\s]*)?["']?/g,
  /linkUrl:\s*["']?([^"'\s#]+)(?:#[^"'\s]*)?["']?/g,
  /linkText:\s*["']?([^"'\s#]+)(?:#[^"'\s]*)?["']?/g,
  /src:\s*["']?([^"'\s#]+)(?:#[^"'\s]*)?["']?/g,
  /\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g,
  /<a[^>]+href=["']([^"'#]+)(?:#[^"']*)?["']/g,
  /window\.location(?:\.href)?\s*=\s*["']([^"'#]+)(?:#[^"']*)?["']/g,
];

const MAX_FILE_BYTES = 1024 * 1024;

function stripCodeBlocks(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}

function extractUrlsFromContent(content: string): string[] {
  const cleaned = stripCodeBlocks(content);
  const urls = new Set<string>();
  for (const re of HREF_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cleaned)) !== null) {
      const u = m[1];
      if (!u) continue;
      if (u.startsWith('javascript:') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('#')) continue;
      if (u.startsWith('data:')) continue;
      urls.add(u);
    }
  }
  return Array.from(urls);
}

function normalizeUrlForCheck(u: string): { path: string; query: string } {
  const [path, query = ''] = u.split('?');
  return { path: path || '/', query };
}

function isInternalUrl(u: string): boolean {
  return u.startsWith('/') && !u.startsWith('//');
}

interface BrokenRef {
  url: string;
  path: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const client = auth.ctx.github;

  let tree: Array<{ path: string; sha: string; size: number; type: string }>;
  try { tree = await client.getRecursiveTree(); } catch (e) { return errorResponse('Failed to read repository file tree: ' + (e instanceof Error ? e.message : 'unknown'), 500); }

  const known = new Set<string>(STATIC_PAGES);
  for (const t of tree) {
    if (t.path.startsWith('src/data/post/') && /\.(md|mdx)$/i.test(t.path)) {
      const slug = t.path.replace(/^src\/data\/post\//, '').replace(/\.(md|mdx)$/i, '');
      known.add(`/news/${slug}`);
    } else if (t.path.startsWith('src/data/product/') && /\.(md|mdx)$/i.test(t.path)) {
      const slug = t.path.replace(/^src\/data\/product\//, '').replace(/\.(md|mdx)$/i, '');
      known.add(`/products/${slug}`);
    }
  }

  try {
    const f = await client.readFile('src/config.yaml');
    const m = f.content.match(/pathname:\s*['"]?([a-z0-9_-]+)['"]?/gi) || [];
    for (const mm of m) {
      const seg = mm.split(':').pop()?.trim().replace(/['"]/g, '');
      if (seg) known.add(`/${seg}`);
    }
  } catch {}

  const targets = tree.filter((t) => shouldScanPath(t.path) && t.size <= MAX_FILE_BYTES);

  const brokenRefs: BrokenRef[] = [];
  const externalRefs: Array<{ url: string; path: string }> = [];
  const seenKeys = new Set<string>();
  const fileStats: Array<{ path: string; urlCount: number; brokenCount: number }> = [];
  let totalUrls = 0;

  const concurrency = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const idx = cursor++;
      const t = targets[idx];
      try {
        const f = await client.readFile(t.path);
        const urls = extractUrlsFromContent(f.content);
        let fileBroken = 0;
        for (const u of urls) {
          totalUrls++;
          if (!isInternalUrl(u)) {
            if (u.startsWith('http://') || u.startsWith('https://')) externalRefs.push({ url: u, path: t.path });
            continue;
          }
          const { path, query } = normalizeUrlForCheck(u);
          if (STATIC_PAGES.has(path)) continue;
          if (PAGE_SLUG_RE.test(path) && Array.from(known).some((k) => k === path || k.startsWith(path + '/'))) continue;
          const key = t.path + '::' + u;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          brokenRefs.push({ url: u, path: t.path });
          fileBroken++;
        }
        if (urls.length > 0) fileStats.push({ path: t.path, urlCount: urls.length, brokenCount: fileBroken });
      } catch {}
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()));

  fileStats.sort((a, b) => b.brokenCount - a.brokenCount);
  brokenRefs.sort((a, b) => a.path.localeCompare(b.path));
  externalRefs.sort((a, b) => a.path.localeCompare(b.path));

  return okResponse({
    known: Array.from(known).sort(),
    broken: brokenRefs,
    external: externalRefs,
    fileStats,
    totalUrls,
    scannedFiles: targets.length,
  });
};
