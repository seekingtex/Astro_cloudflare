import { embed } from '../lib/embed';
import { VECTOR_DIM } from '../lib/vector';

interface Page {
  id: string;
  url: string;
  title: string;
  content: string;
}

interface Env {
  VECTORIZE: FnVectorize;
  AI: any;
  SITEMAP_URL?: string;
}

interface FnVectorize {
  query(vector: number[], options: { topK: number }): Promise<{ matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> }>;
  insert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  upsert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  deleteByIds(ids: string[]): Promise<void>;
  describe(): Promise<{ dimensions: number; metric: string; count: number }>;
}

function chunkText(text: string, size = 400): Array<{ id: number; text: string }> {
  const chunks: Array<{ id: number; text: string }> = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push({ id: Math.floor(i / size), text: text.slice(i, i + size) });
  }
  return chunks;
}

async function ingestPage(page: Page, env: Env): Promise<number> {
  const chunks = chunkText(page.content, 400);
  for (const chunk of chunks) {
    const vector = await embed(chunk.text, env);
    await env.VECTORIZE.upsert([
      {
        id: `${page.id}-${chunk.id}`,
        values: vector,
        metadata: { text: chunk.text, url: page.url, title: page.title },
      },
    ]);
  }
  return chunks.length;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ingest' && request.method === 'POST') {
      const page: Page = await request.json();
      if (!page.id || !page.content) {
        return new Response(JSON.stringify({ error: 'id and content required' }), { status: 400 });
      }
      const count = await ingestPage(page, env);
      return new Response(JSON.stringify({ ingested: count, id: page.id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/reindex' && request.method === 'POST') {
      const sitemapUrl = env.SITEMAP_URL || 'https://alluredna.com/api/ai/sitemap';
      const res = await fetch(sitemapUrl);
      if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
      const data = await res.json() as { pages: Array<{ id: string; url: string; title: string }> };
      let total = 0;
      for (const pageMeta of data.pages) {
        const pageRes = await fetch(`https://alluredna.com${pageMeta.url}`);
        if (!pageRes.ok) continue;
        const html = await pageRes.text();
        const content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ').trim();
        const count = await ingestPage({ ...pageMeta, content }, env);
        total += count;
      }
      return new Response(JSON.stringify({ reindexed: data.pages.length, chunks: total }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/status') {
      const stats = await env.VECTORIZE.describe();
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('ingest worker — POST /ingest, POST /reindex, GET /status', { status: 200 });
  },
};
