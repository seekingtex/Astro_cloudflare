import type { APIRoute } from 'astro';

export const prerender = false;

interface ChatRequest {
  question: string;
  mode?: 'fast' | 'quality';
}

interface Source {
  url: string;
  title: string;
  text: string;
}

async function embedQuery(query: string, env: any): Promise<number[]> {
  const res = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] }) as { data: Array<number[]> };
  return res.data[0];
}

async function callLLM(prompt: string, env: any, mode: string): Promise<string> {
  const workersModel = mode === 'quality' ? '@cf/meta/llama-3.3-70b-instruct-fp8-fast' : '@cf/meta/llama-3.1-8b-instruct';
  const res = await env.AI.run(workersModel, {
    messages: [
      { role: 'system', content: 'You are a helpful website assistant. Answer based on the provided context.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  }) as { response: string };
  return res.response;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Runtime environment not available' }), { status: 500 });
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
  }

  const mode = body.mode || 'fast';

  try {
    const vector = await embedQuery(question, env);
    const searchResults = await env.VECTORIZE.query(vector, { topK: 5 });

    const sources: Source[] = (searchResults.matches || [])
      .filter((m: any) => m.score > 0.25)
      .map((m: any) => ({
        url: (m.metadata as any)?.url || '',
        title: (m.metadata as any)?.title || '',
        text: ((m.metadata as any)?.text || '').slice(0, 600),
      }));

    const context = sources
      .map((s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.text}`)
      .join('\n\n');

    const prompt = `You are a search assistant for Wavefella.

Use ONLY the context below to answer the question. If the context does not contain enough information, say so.

Context:
${context || '(no relevant context found)'}

Question:
${question}

Provide a concise answer with references to the sources when appropriate.`;

    const answer = await callLLM(prompt, env, mode);

    return new Response(
      JSON.stringify({
        answer,
        sources: sources.map((s) => ({ url: s.url, title: s.title })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    try {
      const fallback = await callLLM(question, env, mode);
      return new Response(
        JSON.stringify({ answer: fallback, sources: [], note: 'RAG unavailable, used direct LLM' }),
        { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
      );
    } catch {
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
      );
    }
  }
};
