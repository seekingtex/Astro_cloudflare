export type AiMode = 'fast' | 'quality';
export type AiProvider = 'workers-ai';

export interface GatewayRequest {
  prompt: string;
  system?: string;
  mode?: AiMode;
  maxTokens?: number;
  temperature?: number;
}

export interface GatewayResponse {
  answer: string;
  provider: AiProvider;
  model: string;
  tokens?: number;
}

const MODELS: Record<AiMode, string> = {
  fast: '@cf/meta/llama-3.1-8b-instruct',
  quality: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
};

export async function routeToLLM(
  req: GatewayRequest,
  env: { AI: any },
): Promise<GatewayResponse> {
  const mode = req.mode || 'fast';
  const system = req.system || 'You are a helpful website assistant.';
  const maxTokens = req.maxTokens || 1024;
  const temperature = req.temperature ?? 0.3;

  const model = MODELS[mode];
  const res = await env.AI.run(model, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: req.prompt },
    ],
    max_tokens: maxTokens,
    temperature,
  }) as { response: string };

  return { answer: res.response, provider: 'workers-ai', model };
}

export function getProvider(): AiProvider {
  return 'workers-ai';
}
