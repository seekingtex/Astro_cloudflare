import type { APIRoute } from 'astro';

export const prerender = false;

interface AskRequest {
  question: string;
}

interface Source {
  url: string;
  title: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Runtime environment not available' }), { status: 500 });
  }

  let body: AskRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
  }

  try {
    let vector: number[];

    if (env.AI) {
      const aiRes = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [question] }) as { data: Array<number[]> };
      vector = aiRes.data[0];
    } else {
      return new Response(JSON.stringify({ error: 'AI binding not available' }), { status: 500 });
    }

    const searchResults = await env.VECTORIZE.query(vector, { topK: 10 });

    const sources: Source[] = (searchResults.matches || [])
      .filter((m: any) => m.score > 0.25)
      .map((m: any) => ({
        url: (m.metadata as any)?.url || '',
        title: (m.metadata as any)?.title || '',
        text: ((m.metadata as any)?.text || '').slice(0, 800),
        type: (m.metadata as any)?.type || '',
      }));

    const context = sources
      .map((s: any, i: number) => `[${i + 1}] ${s.title} (${s.url})\n${s.text}`)
      .join('\n\n');

    const prompt = `You are a product explanation assistant for Vectoflare.

Rules:
- Only explain products and company capabilities based on the context below.
- Be neutral and factual. Do not use marketing or sales language.
- Do not persuade the user to buy. Do not use phrases like "best", "perfect", "must-have".
- If the user asks about suitability, explain what the product does and let them decide.
- If the context does not contain enough information to answer, say so clearly.
- Always base your answer on the provided context. Do not invent capabilities.

Context:
${context || '(no relevant context found)'}

Question:
${question}

Provide a concise, factual answer. If you reference specific products, explain what they do neutrally.`;

    const workersModel = '@cf/meta/llama-3.1-8b-instruct';
    const llmRes = await env.AI.run(workersModel, {
      messages: [
        { role: 'system', content: 'You are a neutral, factual product explanation assistant. Do not market or sell.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }) as { response: string };

    return new Response(
      JSON.stringify({
        answer: llmRes.response,
        sources: sources.map((s: any) => ({ url: s.url, title: s.title })),
      }),
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
