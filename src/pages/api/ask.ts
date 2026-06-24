import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { products } from '../../data/products';
import { productGraph } from '../../lib/productGraph';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { question?: string };
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
    const structuredContext = { products, productGraph };

    let ragContext = '';
    if (env.AI && env.VECTORIZE) {
      const aiRes = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [question] }) as { data: Array<number[]> };
      const vector = aiRes.data[0];
      const searchResults = await env.VECTORIZE.query(vector, { topK: 5 });
      const sources = (searchResults.matches || [])
        .filter((m: any) => m.score > 0.25)
        .map((m: any) => ((m.metadata as any)?.text || '').slice(0, 600));
      if (sources.length) {
        ragContext = '\n\nAdditional context from knowledge base:\n' + sources.map((s: any, i: number) => `[${i + 1}] ${s}`).join('\n\n');
      }
    }

    const systemPrompt = `You are Wavefella Product Selection Engine.

You MUST:
- Analyze user skill level and detect environment from the question
- Match the correct product(s) from the provided catalog
- Explain WHY each product matches using category intelligence
- Reference safety rules when relevant

You MUST NOT:
- Sell or use marketing language
- Hallucinate products — only use the provided catalog
- Recommend a product for an environment the product cannot handle

Output format:
Recommended Product: [product name]

Reason:
- [environment/skill match explanation]

Category Intelligence:
- [category fit explanation]

Safety:
- [relevant safety rules]

Warning:
- [any conditions to avoid]`;

    const prompt = `PRODUCT CATALOG:\n${JSON.stringify(structuredContext.products, null, 2)}\n\nCATEGORY INTELLIGENCE:\n${JSON.stringify(structuredContext.productGraph, null, 2)}${ragContext}\n\nQuestion: ${question}`;

    const workersModel = '@cf/meta/llama-3.2-3b-instruct';
    const llmRes = await env.AI.run(workersModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }) as { response: string };

    return new Response(
      JSON.stringify({ answer: llmRes.response }),
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
