import type { APIRoute } from 'astro';
import { authorizeAdmin, errorResponse, jsonResponse } from './_guard';

export const prerender = false;

const FILES = [
  'src/config.yaml',
  'src/data/site/navigation.yaml',
  'src/data/site/branding.yaml',
  'src/data/pages/home.yaml',
  'src/data/pages/about.yaml',
  'src/data/pages/services.yaml',
  'src/data/pages/pricing.yaml',
  'src/data/pages/contact.yaml',
  'src/data/pages/news.yaml',
] as const;

function configTemplate(locale: string, name: string, dir: string): string {
  const upper = locale.toUpperCase();
  return `site:
  name: Wavefella
  site: 'https://Wavefella.com'
  base: '/'
  trailingSlash: false
  googleSiteVerificationId: ''

metadata:
  title:
    default: Wavefella â€?${name}
    template: '%s â€?Wavefella'
  description: 'Wavefella â€?${name}'
  keywords:
    - Wavefella
  author: Wavefella
  robots:
    index: true
    follow: true
  openGraph:
    site_name: Wavefella
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: website
    locale: ${locale}_${upper}
  twitter:
    handle: '@Wavefella'
    site: '@Wavefella'
    cardType: summary_large_image

i18n:
  language: ${locale}
  textDirection: ${dir}

apps:
  blog:
    isEnabled: true
    postsPerPage: 6
    post:
      isEnabled: true
      permalink: '/news/%slug%'
      robots:
        index: true
        follow: true
    list:
      isEnabled: true
      pathname: 'news'
      robots:
        index: true
        follow: true
    category:
      isEnabled: true
      pathname: 'category'
      robots:
        index: true
        follow: true
    tag:
      isEnabled: true
      pathname: 'tag'
      robots:
        index: false
        follow: true
    isRelatedPostsEnabled: true
    relatedPostsCount: 4
  products:
    isEnabled: true
    productsPerPage: 12
    product:
      isEnabled: true
      permalink: '/products/%slug%'
      robots:
        index: true
        follow: true
    list:
      isEnabled: true
      pathname: 'products'
      robots:
        index: true
        follow: true

analytics:
  vendors:
    googleAnalytics:
      id: null

ui:
  theme: 'system'
`;
}

function navTemplate(name: string): string {
  return `header:
  topBar:
    - text: Find a Store
      href: /store-locator
    - text: Help
      href: /help
    - text: Join Us
      href: /join
    - text: Sign In
      href: /login
  links:
    - text: Products
      links:
        - text: All Products
          href: /products
        - text: RIB Boats
          href: /products?category=rib
        - text: Inflatable Boats
          href: /products?category=inflatable
        - text: Accessories
          href: /products?category=accessory
    - text: Solutions
      links:
        - text: Features
          href: /#features
        - text: Services
          href: /services
        - text: Pricing
          href: /pricing
    - text: Resources
      links:
        - text: Blog
          href: /news
        - text: Contact
          href: /contact
        - text: About
          href: /about
    - text: Support
      links:
        - text: News
          href: /news
        - text: Contact
          href: /contact
        - text: About
          href: /about
        - text: R&D Center
          href: /randdcenter
  actions:
    - text: Get a quote
      href: /contact
      variant: primary
footer:
  links:
    - title: Products
      links:
        - text: All Products
          href: /products
        - text: RIB Boats
          href: /products?category=rib
        - text: Inflatable Boats
          href: /products?category=inflatable
        - text: Accessories
          href: /products?category=accessory
    - title: Solutions
      links:
        - text: Features
          href: /#features
        - text: Services
          href: /services
        - text: Pricing
          href: /pricing
    - title: Resources
      links:
        - text: Blog
          href: /news
        - text: Contact
          href: /contact
    - title: Support
      links:
        - text: News
          href: /news
        - text: Contact
          href: /contact
        - text: About
          href: /about
  secondaryLinks:
    - text: Terms
      href: /terms
    - text: Privacy Policy
      href: /privacy
  socialLinks:
    - ariaLabel: X
      icon: tabler:brand-x
      href: '#'
    - ariaLabel: Instagram
      icon: tabler:brand-instagram
      href: '#'
    - ariaLabel: Facebook
      icon: tabler:brand-facebook
      href: '#'
    - ariaLabel: LinkedIn
      icon: tabler:brand-linkedin
      href: '#'
    - ariaLabel: RSS
      icon: tabler:rss
      href: /rss.xml
    - ariaLabel: GitHub
      icon: tabler:brand-github
      href: https://github.com/theworkvigour
  footNote: Â© {year} <a class="text-blue-600 underline dark:text-muted" href="/">{site_name}</a> Â· All rights reserved.
`;
}

const PAGE_FILES = ['home.yaml', 'about.yaml', 'services.yaml', 'pricing.yaml', 'contact.yaml', 'news.yaml'];

async function tryRead(client: import('~/lib/github').GitHubClient, path: string): Promise<string | null> {
  try {
    const r = await client.readFile(path);
    return r.content;
  } catch {
    return null;
  }
}

async function getFileSha(client: import('~/lib/github').GitHubClient, path: string): Promise<string | undefined> {
  try {
    const r = await client.readFile(path);
    return r.sha;
  } catch {
    return undefined;
  }
}

interface LanguageEntry {
  code: string;
  name: string;
  textDirection: string;
  enabled: boolean;
  hasConfig: boolean;
  hasNav: boolean;
  pageCount: number;
}

/** Read the master locale list from src/data/site/languages.yaml via GitHub */
async function readLocaleList(client: import('~/lib/github').GitHubClient): Promise<Array<{ code: string; name: string; locale: string; textDirection: string; enabled: boolean }>> {
  const yamlContent = await tryRead(client, 'src/data/site/languages.yaml');
  if (!yamlContent) return [];
  const yamlMod = await import('js-yaml');
  const parsed = yamlMod.load(yamlContent);
  if (Array.isArray(parsed)) return parsed;
  return [];
}

/** Update the CI workflow matrix.locale line to match the current locale list */
async function syncCiWorkflow(
  client: import('~/lib/github').GitHubClient,
  locales: string[]
): Promise<void> {
  const workflowPath = '.github/workflows/actions.yaml';
  try {
    const existing = await client.readFile(workflowPath);
    const sorted = [...new Set(locales)].sort();
    const localeArray = `        locale: [${sorted.join(', ')}]`;
    const updated = existing.content.replace(
      /^\s+locale:\s*\[.+\]/m,
      localeArray
    );
    if (updated !== existing.content) {
      await client.updateFile(workflowPath, updated, existing.sha, 'chore: sync CI workflow locale matrix');
    }
  } catch {
    // workflow file may not exist yet
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  const client = auth.ctx.github;
  const langList = await readLocaleList(client);
  const results: LanguageEntry[] = [];

  for (const lang of langList) {
    const code = lang.locale;
    const configPath = code === 'en' ? 'src/config.yaml' : `src/config.${code}.yaml`;
    const navPath = `src/data/site/navigation.${code}.yaml`;

    const configContent = await tryRead(client, configPath);
    const navContent = await tryRead(client, navPath);

    let pageCount = 0;
    if (code === 'en') {
      for (const pf of PAGE_FILES) {
        const c = await tryRead(client, `src/data/pages/${pf}`);
        if (c) pageCount++;
      }
    } else {
      for (const pf of PAGE_FILES) {
        const c = await tryRead(client, `src/data/pages/${code}/${pf}`);
        if (c) pageCount++;
      }
    }

    results.push({
      code,
      name: lang.name || code.toUpperCase(),
      textDirection: lang.textDirection || 'ltr',
      enabled: lang.enabled !== false,
      hasConfig: !!configContent,
      hasNav: !!navContent,
      pageCount,
    });
  }

  return jsonResponse({ languages: results });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: { code?: string; name?: string; textDirection?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request', 400);
  }

  const code = body.code?.trim().toLowerCase();
  const name = body.name?.trim();
  const textDirection = body.textDirection === 'rtl' ? 'rtl' : 'ltr';

  if (!code || !/^[a-z]{2,3}$/.test(code)) {
    return errorResponse('Language code must be 2-3 lowercase letters (e.g. ja, ko, ar)', 400);
  }
  if (!name) {
    return errorResponse('Display name is required', 400);
  }

  const client = auth.ctx.github;
  const configPath = `src/config.${code}.yaml`;
  const navPath = `src/data/site/navigation.${code}.yaml`;

  const existingConfig = await tryRead(client, configPath);
  if (existingConfig) {
    return errorResponse(`Language "${code}" already exists (config.${code}.yaml found)`, 409);
  }

  try {
    // 0. update languages.yaml master list
    const languagesYamlPath = 'src/data/site/languages.yaml';
    let existingList: Array<{ code: string; name: string; locale: string; textDirection?: string }> = [];
    try {
      const existing = await client.readFile(languagesYamlPath);
      const yamlMod = await import('js-yaml');
      const parsed = yamlMod.load(existing.content);
      if (Array.isArray(parsed)) existingList = parsed;
    } catch {}
    existingList = existingList.filter((l) => l.locale !== code);
    existingList.push({ code: code.toUpperCase(), name, locale: code, textDirection, enabled: false });
    existingList.sort((a, b) => a.locale.localeCompare(b.locale));
    const yamlMod = await import('js-yaml');
    const newYamlContent = yamlMod.dump(existingList, { lineWidth: 120, noRefs: true, sortKeys: false, quotingType: "'" });
    const langSha = await getFileSha(client, languagesYamlPath);
    if (langSha) {
      await client.updateFile(languagesYamlPath, newYamlContent, langSha, `feat: add ${code} to languages.yaml`);
    } else {
      await client.createFile(languagesYamlPath, newYamlContent, `feat: add ${code} to languages.yaml`);
    }

    // 1. create config file
    await client.createFile(configPath, configTemplate(code, name, textDirection), `feat: add ${code} language config`);

    // 2. create navigation file
    await client.createFile(navPath, navTemplate(name), `feat: add ${code} navigation`);

    // 3. copy English pages as initial content
    for (const pf of PAGE_FILES) {
      const srcContent = await tryRead(client, `src/data/pages/${pf}`);
      if (srcContent) {
        const destPath = `src/data/pages/${code}/${pf}`;
        await client.createFile(destPath, srcContent, `feat: add ${code} ${pf}`);
      }
    }

    // 4. sync CI workflow with updated locale list
    const updatedList = [...existingList.filter((l) => l.locale !== code), { code: code.toUpperCase(), name, locale: code, textDirection }];
    updatedList.sort((a, b) => a.locale.localeCompare(b.locale));
    await syncCiWorkflow(client, updatedList.map((l) => l.locale));

    return jsonResponse({ success: true, code, message: `Language "${code}" created successfully` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create language';
    return errorResponse(message, 500);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const auth = authorizeAdmin(cookies);
  if (!auth.ok) return errorResponse(auth.error, auth.status);

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request', 400);
  }

  const code = body.code?.trim().toLowerCase();
  if (!code || code === 'en') {
    return errorResponse('Cannot delete default language (en)', 400);
  }

  const client = auth.ctx.github;

  const toDelete: string[] = [];
  toDelete.push(`src/config.${code}.yaml`);
  toDelete.push(`src/data/site/navigation.${code}.yaml`);
  for (const pf of PAGE_FILES) {
    toDelete.push(`src/data/pages/${code}/${pf}`);
  }

  const errors: string[] = [];

  // remove from languages.yaml
  let remainingLocales: string[] = [];
  try {
    const yamlMod = await import('js-yaml');
    const existing = await client.readFile('src/data/site/languages.yaml');
    const parsed = yamlMod.load(existing.content);
    if (Array.isArray(parsed)) {
      const updated = parsed.filter((l: { locale?: string }) => l.locale !== code);
      remainingLocales = updated.map((l: { locale: string }) => l.locale);
      const newContent = yamlMod.dump(updated, { lineWidth: 120, noRefs: true, sortKeys: false, quotingType: "'" });
      const sha = existing.sha;
      await client.updateFile('src/data/site/languages.yaml', newContent, sha, `chore: remove ${code} from languages.yaml`);
    }
  } catch (e) {
    errors.push(`languages.yaml: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // sync CI workflow
  if (remainingLocales.length > 0) {
    try {
      await syncCiWorkflow(client, remainingLocales);
    } catch (e) {
      errors.push(`CI workflow: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  for (const filePath of toDelete) {
    const sha = await getFileSha(client, filePath);
    if (sha) {
      try {
        await client.deleteFile(filePath, sha, `chore: remove ${code} language files`);
      } catch (e) {
        errors.push(`${filePath}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }
  }

  return jsonResponse({
    success: true,
    code,
    message: `Language "${code}" removed`,
    errors: errors.length > 0 ? errors : undefined,
  });
};
