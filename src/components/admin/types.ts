export interface CollectionFormData {
  frontmatter: Record<string, unknown>;
  body: string;
  sha?: string;
  path?: string;
  filename?: string;
}
