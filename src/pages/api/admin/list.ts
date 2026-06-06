import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, okResponse } from './_guard';
import { parseMarkdown } from '~/lib/markdown';

export const prerender = false;

const ALLOWED_PREFIXES = [
  'src/data/post/',
  'src/data/product/',
  'src/data/pages/',
  'src/data/site/',
];

export const GET: APIRoute = async ({ url, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const prefix = url.searchParams.get('prefix') ?? '';
  if (!ALLOWED_PREFIXES.includes(prefix)) {
    return errorResponse('prefix not in allowed list', 400);
  }

  const isYaml = prefix.startsWith('src/data/pages/') || prefix.startsWith('src/data/site/');

  try {
    const files = await auth.ctx.github.listFiles(prefix);
    const matcher = isYaml ? /\.(ya?ml)$/i : /\.(md|mdx)$/i;
    const items = files.filter((f) => matcher.test(f.name));

    if (isYaml) {
      const enriched = await Promise.all(
        items.map(async (f) => {
          try {
            const file = await auth.ctx.github.readFile(f.path);
            const yamlMod = await import('js-yaml');
            const data = yamlMod.load(file.content) as Record<string, unknown>;
            const topKeys = Object.keys(data ?? {}).slice(0, 6);
            return {
              name: f.name,
              path: f.path,
              sha: f.sha,
              size: f.size,
              downloadUrl: f.download_url,
              title: (data?.title as string) ?? f.name.replace(/\.(ya?ml)$/i, ''),
              topKeys,
            };
          } catch {
            return {
              name: f.name,
              path: f.path,
              sha: f.sha,
              size: f.size,
              downloadUrl: f.download_url,
              title: f.name.replace(/\.(ya?ml)$/i, ''),
              topKeys: [],
            };
          }
        }),
      );
      enriched.sort((a, b) => a.name.localeCompare(b.name));
      return okResponse({ items: enriched });
    }

    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const res = await auth.ctx.github.readFile(item.path);
          const parsed = parseMarkdown(res.content);
          const fm = parsed.frontmatter as Record<string, unknown>;
          return {
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            downloadUrl: item.download_url,
            title: (fm.title as string) ?? item.name.replace(/\.(md|mdx)$/i, ''),
            date: typeof fm.publishDate === 'string' ? fm.publishDate : '',
            category: typeof fm.category === 'string' ? fm.category : '',
            draft: fm.draft === true,
          };
        } catch {
          return {
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            downloadUrl: item.download_url,
            title: item.name.replace(/\.(md|mdx)$/i, ''),
            date: '',
            category: '',
            draft: false,
          };
        }
      }),
    );
    enriched.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return okResponse({ items: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list';
    return errorResponse(message, 500);
  }
};
