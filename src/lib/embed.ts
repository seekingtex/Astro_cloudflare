import { VECTOR_DIM, toVectorInput } from './vector';

const embedCache = new Map<string, { embedding: number[]; cachedAt: number }>();
const CACHE_TTL = 86400000;

export interface EmbedEnv {
  AI?: any;
}

export async function embed(text: string, env: EmbedEnv): Promise<number[]> {
  const normalized = toVectorInput(text);

  const cached = embedCache.get(normalized);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.embedding;
  }

  const res = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] }) as { data: Array<number[]> };
  const vector = res.data[0];

  if (vector.length !== VECTOR_DIM) {
    console.warn(`embed: expected ${VECTOR_DIM} dims, got ${vector.length}`);
  }

  embedCache.set(normalized, { embedding: vector, cachedAt: Date.now() });
  return vector;
}

export function clearEmbedCache(): void {
  embedCache.clear();
}
