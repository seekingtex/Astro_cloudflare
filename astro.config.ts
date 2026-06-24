import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';
import type { Plugin } from 'vite';

import { unified } from '@astrojs/markdown-remark';
import yaml from 'js-yaml';

import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import cloudflare from '@astrojs/cloudflare';
import type { AstroIntegration } from 'astro';
import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locale = process.env.SITE_LOCALE || 'en';

function yamlPlugin(): Plugin {
  return {
    name: 'inline-yaml-loader',
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith('.yaml') && !id.endsWith('.yml')) return null;
      const clean = id.split('?')[0];
      if (locale !== 'en') {
        const pagesMatch = clean.match(/[/\\]data[/\\]pages[/\\](.+\.ya?ml)$/);
        if (pagesMatch) {
          const localePath = clean.replace(
            /[/\\]pages[/\\]/,
            `/pages/${locale}/`
          );
          try {
            await fs.access(localePath);
            const content = await fs.readFile(localePath, 'utf8');
            const data = yaml.load(content);
            return { code: `export default ${JSON.stringify(data)};`, map: null };
          } catch {
            // locale file not found, fall back to English
          }
        }
      }
      const content = await fs.readFile(clean, 'utf8');
      const data = yaml.load(content);
      return {
        code: `export default ${JSON.stringify(data)};`,
        map: null,
      };
    },
  };
}

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

const configFile = locale === 'en' ? './src/config.yaml' : `./src/config.${locale}.yaml`;

export default defineConfig({
  output: 'static',

  adapter: cloudflare({
    runtime: process.env.CI ? 'local' : 'remote',
  }),

  integrations: [
    sitemap({
      filter: (page) =>
        !/\/(keystatic|admin|login|api|404|500)(?:\/|$)/.test(page),
    }),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: configFile,
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
  },

  vite: {
    plugins: [yamlPlugin()],
    server: {
      watch: {
        ignored: ['**/tina/**', '**/.tina/**', '**/tina-lock.json'],
      },
    },

    optimizeDeps: {
      exclude: ['@keystatic/core'],
    },

    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
        ...(locale !== 'en'
          ? {
              '~/data/site/navigation.yaml': path.resolve(
                __dirname,
                `./src/data/site/navigation.${locale}.yaml`
              ),
            }
          : {}),
      },
    },
  },
});
