export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubContentFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string;
  type: 'file' | 'dir';
  encoding?: string;
  content?: string;
}

export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{ resource?: string; field?: string; code?: string; message?: string }>;
}

export interface CommitResult {
  commitSha: string;
  contentSha: string;
  commitUrl: string;
  contentPath: string;
}

const REPO_OWNER = 'theworkvigour';
const REPO_NAME = 'Astro_cloudflare';
const DEFAULT_BRANCH = 'main';
const COMMIT_AUTHOR_NAME = 'Vectoflare Admin';
const COMMIT_AUTHOR_EMAIL = 'admin@vectoflare.local';
const USER_AGENT = 'vectoflare-admin';

export class GitHubClient {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let parsed: GitHubApiError | null = null;
      try {
        parsed = JSON.parse(errorBody) as GitHubApiError;
      } catch {
        parsed = { message: errorBody || res.statusText };
      }
      const err = new GitHubRequestError(parsed.message || res.statusText, res.status, parsed);
      throw err;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async verifyToken(): Promise<GitHubUser> {
    return this.request<GitHubUser>('GET', '/user');
  }

  async listFiles(dirPath: string): Promise<GitHubContentFile[]> {
    const normalized = dirPath.replace(/^\/+|\/+$/g, '');
    const items = await this.request<GitHubContentFile[] | GitHubContentFile>(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${DEFAULT_BRANCH}`,
    );
    return Array.isArray(items) ? items.filter((i) => i.type === 'file') : [];
  }

  async getRecursiveTree(): Promise<Array<{ path: string; sha: string; size: number; type: string }>> {
    interface TreeResp {
      sha: string;
      url: string;
      tree: Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
      truncated: boolean;
    }
    const res = await this.request<TreeResp>(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${DEFAULT_BRANCH}?recursive=1`,
    );
    return res.tree
      .filter((t) => t.type === 'blob' && typeof t.size === 'number')
      .map((t) => ({ path: t.path, sha: t.sha, size: t.size as number, type: t.type }));
  }

  async readFile(filePath: string): Promise<{ sha: string; content: string; downloadUrl: string }> {
    const normalized = filePath.replace(/^\/+/, '');
    const item = await this.request<GitHubContentFile>(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${DEFAULT_BRANCH}`,
    );
    if (!item.content) {
      throw new GitHubRequestError('Empty file content', 500);
    }
    const decoded = Buffer.from(item.content, 'base64').toString('utf-8');
    return { sha: item.sha, content: decoded, downloadUrl: item.download_url };
  }

  async createFile(filePath: string, content: string, message: string): Promise<CommitResult> {
    const normalized = filePath.replace(/^\/+/, '');
    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const res = await this.request<{ commit: { sha: string; html_url: string }; content: { sha: string; path: string; html_url: string } }>(
      'PUT',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}`,
      {
        message,
        branch: DEFAULT_BRANCH,
        content: encoded,
        author: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
        committer: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
      },
    );
    return {
      commitSha: res.commit.sha,
      contentSha: res.content.sha,
      commitUrl: res.commit.html_url,
      contentPath: res.content.path,
    };
  }

  async updateFile(
    filePath: string,
    content: string,
    sha: string,
    message: string,
  ): Promise<CommitResult> {
    const normalized = filePath.replace(/^\/+/, '');
    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const res = await this.request<{ commit: { sha: string; html_url: string }; content: { sha: string; path: string; html_url: string } }>(
      'PUT',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}`,
      {
        message,
        branch: DEFAULT_BRANCH,
        content: encoded,
        sha,
        author: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
        committer: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
      },
    );
    return {
      commitSha: res.commit.sha,
      contentSha: res.content.sha,
      commitUrl: res.commit.html_url,
      contentPath: res.content.path,
    };
  }

  async deleteFile(filePath: string, sha: string, message: string): Promise<{ commitSha: string; commitUrl: string }> {
    const normalized = filePath.replace(/^\/+/, '');
    const encodedMessage = encodeURIComponent(message);
    const res = await this.request<{ commit: { sha: string; html_url: string } }>(
      'DELETE',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${DEFAULT_BRANCH}&message=${encodedMessage}&sha=${sha}`,
    );
    return { commitSha: res.commit.sha, commitUrl: res.commit.html_url };
  }
}

export class GitHubRequestError extends Error {
  status: number;
  detail: GitHubApiError | null;
  constructor(message: string, status: number, detail: GitHubApiError | null = null) {
    super(message);
    this.name = 'GitHubRequestError';
    this.status = status;
    this.detail = detail;
  }
}

export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}
