// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="../vendor/integration/types.d.ts" />

// Fontsource packages ship CSS only (no type declarations); declare them so
// side-effect imports type-check under TypeScript 6 strict (ts2882).
declare module '@fontsource-variable/*';
declare module '@fontsource/*';

// ─── Cloudflare Runtime Types ──────────────────────────────────

interface FnVectorize {
  query(vector: number[], options: { topK: number; filter?: Record<string, string> }): Promise<{
    matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
  }>;
  insert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  upsert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  deleteByIds(ids: string[]): Promise<void>;
  describe(): Promise<{ dimensions: number; metric: string; count: number }>;
}

interface AiTextEmbeddingInput {
  text: string[];
}
interface AiTextEmbeddingOutput {
  data: number[][];
  shape: number[];
}

interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
interface AiChatInput {
  messages: AiChatMessage[];
  max_tokens?: number;
  temperature?: number;
}
interface AiChatOutput {
  response: string;
}

declare class Ai {
  run(model: '@cf/baai/bge-base-en-v1.5', input: AiTextEmbeddingInput): Promise<AiTextEmbeddingOutput>;
  run(model: '@cf/meta/llama-3.1-8b-instruct', input: AiChatInput): Promise<AiChatOutput>;
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        VECTORIZE: FnVectorize;
        AI: Ai;
        SESSION_SECRET?: string;
        KEYSTATIC_SECRET?: string;
        NODE_ENV?: string;
      };
    };
  }
}
