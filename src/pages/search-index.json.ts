import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import yaml from 'js-yaml';

export const prerender = true;

const SITE = '';

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(s: string, n = 140): string {
  s = String(s || '').trim();
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trim() + '…';
}

function plainText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(plainText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(plainText).join(' ');
  return String(value);
}

const pageRawModules: Record<string, string> = import.meta.glob('/src/data/pages/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const GET: APIRoute = async () => {
  const items: any[] = [];

  try {
    const posts = await getCollection('post');
    for (const post of posts) {
      if (post.data.draft) continue;
      const body = post.body || '';
      const fm: any = post.data;
      items.push({
        title: fm.title || 'Untitled',
        url: `${SITE}/news/${post.id.replace(/\.(md|mdx)$/i, '')}`,
        excerpt: excerpt(fm.excerpt || fm.description || stripHtml(body)),
        type: 'post',
        tags: fm.tags || [],
      });
    }
  } catch {}

  try {
    const products = await getCollection('product');
    for (const product of products) {
      if (product.data.draft) continue;
      const body = product.body || '';
      const fm: any = product.data;
      items.push({
        title: fm.title || 'Untitled',
        url: `${SITE}/products/${product.id.replace(/\.(md|mdx)$/i, '')}`,
        excerpt: excerpt(fm.excerpt || fm.description || stripHtml(body)),
        type: 'product',
        tags: fm.tags || [fm.category].filter(Boolean),
      });
    }
  } catch {}

  const pageSlugs = ['home', 'about', 'services', 'pricing', 'contact'];
  for (const slug of pageSlugs) {
    const modulePath = `/src/data/pages/${slug}.yaml`;
    const raw = pageRawModules[modulePath];
    let data: any = {};
    if (raw) {
      try {
        data = yaml.load(raw) || {};
      } catch {}
    }
    const heroKey = (slug === 'home' || slug === 'about' || slug === 'services') ? 'hero' : 'hero_text';
    const hero = data[heroKey] || {};
    const sectionTitles: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === heroKey) continue;
      const t = (v as any)?.title;
      if (typeof t === 'string') sectionTitles.push(t);
    }
    const url = slug === 'home' ? `${SITE}/` : `${SITE}/${slug}`;
    const title = (typeof hero?.title === 'string' ? stripHtml(hero.title) : slug.charAt(0).toUpperCase() + slug.slice(1)) || slug;
    items.push({
      title,
      url,
      excerpt: excerpt(plainText(hero?.subtitle || hero?.content || sectionTitles.join(' '))),
      type: 'page',
      tags: [slug, ...sectionTitles].slice(0, 6),
    });
  }

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
