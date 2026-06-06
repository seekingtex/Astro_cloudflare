export interface RefactorRule {
  oldUrl?: string;
  newUrl?: string;
  oldName?: string;
  newName?: string;
}

export interface FileMatch {
  path: string;
  sha: string;
  occurrences: number;
  originalContent: string;
  newContent: string;
  diff: DiffLine[];
}

export interface DiffLine {
  kind: 'ctx' | 'url' | 'name' | 'add' | 'del';
  line: number;
  before: string;
  after: string;
}

export interface ScanRequest extends RefactorRule {}

export interface ScanResult {
  rule: RefactorRule;
  files: FileMatch[];
  totalOccurrences: number;
  fileCount: number;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeUrlForMatch(u: string): string {
  if (!u) return u;
  return u.replace(/\/+$/, '');
}

export function buildUrlPattern(oldUrl: string): RegExp {
  const u = normalizeUrlForMatch(oldUrl);
  if (!u) return /(?!)/;
  const esc = escapeRegex(u);
  return new RegExp(`(?<![A-Za-z0-9_\\-])${esc}(?![A-Za-z0-9_\\-])`, 'g');
}

export function buildNamePattern(oldName: string): RegExp {
  if (!oldName) return /(?!)/;
  const esc = escapeRegex(oldName);
  return new RegExp(`(?<![A-Za-z0-9_])${esc}(?![A-Za-z0-9_])`, 'g');
}

function isSkippableContext(text: string, matchIndex: number): boolean {
  let inFence = false;
  let inInline = false;
  let i = 0;
  while (i < matchIndex) {
    if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
      inFence = !inFence;
      i += 3;
      continue;
    }
    if (!inFence && text[i] === '`') {
      inInline = !inInline;
    }
    i++;
  }
  return inFence || inInline;
}

export function applyRuleToText(text: string, rule: RefactorRule): { text: string; urlCount: number; nameCount: number } {
  let out = text;
  let urlCount = 0;
  let nameCount = 0;
  if (rule.oldUrl && rule.newUrl && rule.oldUrl !== rule.newUrl) {
    const newUrl = rule.newUrl;
    const re = buildUrlPattern(rule.oldUrl);
    out = out.replace(re, (matched, offset) => {
      if (isSkippableContext(out, offset)) return matched;
      urlCount++;
      return newUrl;
    });
  }
  if (rule.oldName && rule.newName && rule.oldName !== rule.newName) {
    const newName = rule.newName;
    const re = buildNamePattern(rule.oldName);
    out = out.replace(re, (matched, offset) => {
      if (isSkippableContext(out, offset)) return matched;
      nameCount++;
      return newName;
    });
  }
  return { text: out, urlCount, nameCount };
}

export function scanFile(path: string, content: string, rule: RefactorRule, sha: string): FileMatch | null {
  const { text: newContent, urlCount, nameCount } = applyRuleToText(content, rule);
  const occurrences = urlCount + nameCount;
  if (occurrences === 0 || newContent === content) return null;
  const diff = buildDiff(content, newContent, rule);
  return { path, sha, occurrences, originalContent: content, newContent, diff };
}

function buildDiff(before: string, after: string, rule: RefactorRule): DiffLine[] {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const lines: DiffLine[] = [];
  const re = (rule.oldUrl && rule.newUrl) ? buildUrlPattern(rule.oldUrl) : null;
  const reName = (rule.oldName && rule.newName) ? buildNamePattern(rule.oldName) : null;
  const maxLen = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < maxLen; i++) {
    const b = beforeLines[i] ?? '';
    const a = afterLines[i] ?? '';
    if (b === a) {
      lines.push({ kind: 'ctx', line: i + 1, before: b, after: a });
      continue;
    }
    if (re && re.test(b)) lines.push({ kind: 'url', line: i + 1, before: b, after: a });
    else if (reName && reName.test(b)) lines.push({ kind: 'name', line: i + 1, before: b, after: a });
    else lines.push({ kind: 'ctx', line: i + 1, before: b, after: a });
    if (re) re.lastIndex = 0;
    if (reName) reName.lastIndex = 0;
  }
  return lines;
}

export function validateRule(rule: RefactorRule): string | null {
  if (!rule.oldUrl && !rule.oldName) return 'Please provide at least one oldUrl or oldName';
  if (rule.oldUrl && !rule.newUrl) return 'oldUrl provided but newUrl is empty';
  if (rule.oldName && !rule.newName) return 'oldName provided but newName is empty';
  if (rule.oldUrl && rule.newUrl) {
    if (rule.oldUrl.length < 2) return 'oldUrl too short, may cause false matches (min 2 chars)';
    if (!rule.oldUrl.startsWith('/') && !rule.oldUrl.startsWith('http')) {
      return 'oldUrl should start with / (internal) or http(s):// (external)';
    }
  }
  if (rule.oldName && rule.newName) {
    if (rule.oldName.length < 2) return 'oldName too short (min 2 chars)';
  }
  return null;
}

const SCAN_PATH_PREFIXES = [
  'src/data/post/',
  'src/data/product/',
  'src/data/pages/',
  'src/data/site/',
];

export function shouldScanPath(path: string): boolean {
  if (!SCAN_PATH_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (path.startsWith('src/data/contact/')) return false;
  if (/\.(enc\.json|contact-pats\.json)$/i.test(path)) return false;
  if (/\.(md|mdx|ya?ml|json)$/i.test(path)) return true;
  return false;
}
