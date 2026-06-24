import type { Ai } from '/.astro/ai';
import { embed } from './embed';
import { VECTOR_DIM, type FnVectorize } from './vector';

export interface EnvBindings {
  VECTORIZE: FnVectorize;
  AI: Ai;
}

export interface Chunk {
  id: string;
  text: string;
  page: string;
  title: string;
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  page: string;
  title: string;
}

export function chunkText(text: string, maxLength = 500, overlap = 50): Array<{ id: number; text: string }> {
  const chunks: Array<{ id: number; text: string }> = [];
  const paragraphs = text.split(/\n\s*\n/);
  let buffer = '';
  let chunkId = 0;

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    if (buffer.length + trimmed.length > maxLength && buffer.length > 0) {
      chunks.push({ id: chunkId++, text: buffer.trim() });
      buffer = buffer.slice(-overlap) + '\n';
    }
    buffer += (buffer ? '\n\n' : '') + trimmed;
  }
  if (buffer.trim()) chunks.push({ id: chunkId, text: buffer.trim() });
  return chunks;
}

export async function searchSimilar(
  query: string,
  env: EnvBindings,
  topK = 5,
  filter?: Record<string, string>,
): Promise<SearchResult[]> {
  const qVector = await embed(query, env);
  const results = await env.VECTORIZE.query(qVector, { topK, filter });

  return results.matches
    .filter((m) => m.score > 0.25)
    .map((m) => ({
      id: m.id,
      score: m.score,
      text: (m.metadata?.text as string) || '',
      page: (m.metadata?.page as string) || (m.metadata?.url as string) || '',
      title: (m.metadata?.title as string) || '',
    }));
}

export function assembleContext(results: SearchResult[], maxChars = 6000): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title} (${r.page})\n${r.text}`)
    .join('\n\n')
    .slice(0, maxChars);
}

async function answerWorkersAI(prompt: string, ai: Ai): Promise<string> {
  const res = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'You are a helpful website assistant. Answer based on the provided context.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  }) as { response: string };
  return res.response;
}

export async function generateAnswer(systemPrompt: string, userPrompt: string, env: EnvBindings): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  return answerWorkersAI(fullPrompt, env.AI);
}

export async function rag(
  question: string,
  env: EnvBindings,
  options?: { topK?: number; filter?: Record<string, string> },
): Promise<{ answer: string; sources: SearchResult[] }> {
  const results = await searchSimilar(question, env, options?.topK || 5, options?.filter);
  const context = assembleContext(results);
  const systemPrompt = 'You are a website assistant for Wavefella. Answer concisely based on the context below. If the context does not answer the question, say you do not know.';
  const userPrompt = `Context:\n${context || '(no relevant context found)'}\n\nQuestion:\n${question}`;
  const answer = await generateAnswer(systemPrompt, userPrompt, env);
  return { answer, sources: results };
}

export interface IndexablePage {
  id: string;
  url: string;
  title: string;
  content: string;
}

export async function indexPage(page: IndexablePage, env: EnvBindings): Promise<number> {
  const chunks = chunkText(page.content, 500);
  const vectors = await Promise.all(
    chunks.map(async (chunk) => ({
      id: `${page.id}-${chunk.id}`,
      values: await embed(chunk.text, env),
      metadata: { text: chunk.text, page: page.url, title: page.title },
    })),
  );
  await env.VECTORIZE.upsert(vectors);
  return vectors.length;
}
