import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { parseMarkdown } from '~/lib/markdown';

export const prerender = false;

const ALLOWED_PREFIXES = ['src/data/post/', 'src/data/product/'];

export const GET: APIRoute = async ({ url, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const prefix = url.searchParams.get('prefix') ?? '';
  if (!ALLOWED_PREFIXES.includes(prefix)) {
    return errorResponse('prefix 不在允许列表中', 400);
  }

  try {
    const files = await auth.ctx.github.listFiles(prefix);
    const items = files
      .filter((f) => /\.(md|mdx)$/i.test(f.name))
      .map((f) => {
        let title = f.name.replace(/\.(md|mdx)$/i, '');
        let date = '';
        let category = '';
        try {
          const dl = JSON.parse(Buffer.from(f.name + ':peek', 'utf-8').toString('utf-8'));
          void dl;
        } catch {}
        return {
          name: f.name,
          path: f.path,
          sha: f.sha,
          size: f.size,
          downloadUrl: f.download_url,
          title,
          date,
          category,
        };
      });

    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const res = await auth.ctx.github.readFile(item.path);
          const parsed = parseMarkdown(res.content);
          const fm = parsed.frontmatter as Record<string, unknown>;
          return {
            ...item,
            title: (fm.title as string) ?? item.title,
            date: typeof fm.publishDate === 'string' ? fm.publishDate : '',
            category: typeof fm.category === 'string' ? fm.category : '',
            draft: fm.draft === true,
          };
        } catch {
          return item;
        }
      }),
    );

    enriched.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return okResponse({ items: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : '列表失败';
    return errorResponse(message, 500);
  }
};
