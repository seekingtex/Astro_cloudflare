import yaml from 'js-yaml';

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
  raw: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseMarkdown(input: string): ParsedMarkdown {
  if (!input || !input.startsWith('---')) {
    return { frontmatter: {}, body: input ?? '', raw: input ?? '' };
  }
  const match = input.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: input, raw: input };
  }
  const [, yamlBlock, body] = match;
  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(yamlBlock);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    frontmatter = {};
  }
  return { frontmatter, body: body ?? '', raw: input };
}

export function stringifyMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const cleaned = cleanFrontmatter(frontmatter);
  if (Object.keys(cleaned).length === 0) {
    return body;
  }
  const yamlStr = yaml.dump(cleaned, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
  });
  return `---\n${yamlStr}---\n${body.startsWith('\n') ? body : '\n' + body}`;
}

function cleanFrontmatter(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = cleanFrontmatter(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[key] = nested;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function dateToYmd(input: unknown): string {
  if (input instanceof Date) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof input === 'string' && input.length >= 10) return input.slice(0, 10);
  return '';
}

export function todayYmd(): string {
  const now = new Date();
  return dateToYmd(now);
}
