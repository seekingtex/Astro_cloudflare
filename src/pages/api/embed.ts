import type { APIRoute } from 'astro';
import { VECTOR_DIM } from '../../lib/vector';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Runtime environment not available' }), { status: 500 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400 });
  }

  try {
    const res = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] }) as { data: Array<number[]> };
    const vector = res.data[0];

    return new Response(
      JSON.stringify({ dimensions: vector.length, vector }),
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
