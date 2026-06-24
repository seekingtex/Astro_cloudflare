import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Runtime environment not available' }), { status: 500 });
  }

  let body: { query?: string; topK?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 });
  }

  const topK = Math.min(body.topK || 5, 20);

  try {
    const aiRes = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] }) as { data: Array<number[]> };
    const vector = aiRes.data[0];

    const results = await env.VECTORIZE.query(vector, { topK });

    const matches = (results.matches || [])
      .filter((m: any) => m.score > 0.25)
      .map((m: any) => ({
        id: m.id,
        score: Math.round(m.score * 10000) / 10000,
        title: (m.metadata as any)?.title || '',
        url: (m.metadata as any)?.url || '',
        text: ((m.metadata as any)?.text || '').slice(0, 400),
      }));

    return new Response(
      JSON.stringify({ query, results: matches, total: matches.length }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }
};
