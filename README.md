# Wavefella �?AI-Powered Multilingual Site

**Perplexity-style AI search engine** with RAG, semantic search, multi-model LLM routing, encrypted contact forms, and a Keystatic admin panel �?all running on Cloudflare Workers free tier.

Built on [AstroWind](https://github.com/arthelokyo/astrowind), deployed as Cloudflare Workers (static + SSR).

---

## Architecture

```
┌─ User ──────────────────────────────────────�?�? Browser �?Static HTML (Cloudflare Workers)  �?�?        �?/api/search  (semantic search)     �?�?        �?/api/chat    (RAG Q&A + citations) �?�?        �?/keystatic   (admin panel)         �?└──────────────────────────────────────────────�?         �?         �?┌─ AI Engine ──────────────────────────────────�?�? Vectorize (768-dim cosine)                 �?�?   �?                                        �?�? embed() �?AI_GATEWAY / OpenAI / Workers AI  �?�?   �?                                        �?�? LLM �?gpt-4o-mini / Llama 3.1 / Llama 3.3  �?�?   �?                                        �?�? Answer + source references                  �?└──────────────────────────────────────────────�?         �?         �?┌─ Data Layer ─────────────────────────────────�?�? src/config.yaml       Site config           �?�? src/data/site/        Languages, navigation �?�? src/data/post/        Blog posts (MD/MDX)   �?�? src/data/product/     Product data          �?�? src/data/contact/     Encrypted submissions �?�? src/data/pages/       Page content (YAML)   �?└──────────────────────────────────────────────�?```

### Provider Fallback Chain

```
AI_GATEWAY (Cloudflare AI Gateway proxy) �?best performance
  �?(if unset)
OPENAI_API_KEY �?gpt-4o-mini / text-embedding-3-small (768-dim)
  �?(if unset)
Workers AI (free tier) �?Llama 3.1 8B / bge-base-en-v1.5 (768-dim)
```

---

## Quick Start

```bash
# Dependencies
corepack enable
yarn install

# Local dev (English)
yarn dev

# Local dev (specific locale)
SITE_LOCALE=fr yarn dev

# Build for production
yarn build
```

### Required: `.dev.vars`

```
SESSION_SECRET=your-random-secret-here
```

---

## AI Search Engine

| Component | File | Purpose |
|-----------|------|---------|
| Vector config | `src/lib/vector.ts` | 768-dim constant, input preprocessing |
| Embedding | `src/lib/embed.ts` | Text→vector with 24h in-memory cache |
| RAG engine | `src/lib/rag.ts` | chunk �?embed �?search �?assemble �?answer |
| LLM router | `src/lib/ai-gateway.ts` | Multi-model with fallback |
| Search API | `POST /api/search` | Semantic search endpoint |
| Chat API | `POST /api/chat` | RAG Q&A with source citations |
| Embed API | `POST /api/embed` | Standalone embedding |
| AI sitemap | `GET /api/ai/sitemap` | Page index for knowledge base |
| Chat widget | `AIChat.astro` | Floating bubble UI (in Layout.astro) |
| Ingest Worker | `src/workers/ingest.ts` | Standalone index ingestion |
| Seed script | `scripts/seed-vectorize.js` | One-time index builder |

### Setup

```bash
# 1. Create Vectorize index (one-time)
npx wrangler vectorize create ai-index --dimensions=768 --metric=cosine

# 2. Set secrets
npx wrangler secret put OPENAI_API_KEY   # optional (free Workers AI fallback)
npx wrangler secret put SESSION_SECRET

# 3. Seed knowledge base
npm run build
npm run dev &                    # background dev server
node scripts/seed-vectorize.js

# 4. Deploy
git push origin main             # CI/CD auto-deploys

# 5. (Optional) Deploy ingestion Worker separately
npx wrangler deploy src/workers/ingest.ts --name Wavefella-ingest \
  --compatibility-date 2026-06-05
```

### Free Tier Budget

| Resource | Free Limit | Our Usage (per chat) |
|----------|-----------|---------------------|
| Workers AI | 500 req/day | 1 embed + 1 LLM |
| Vectorize | 1M queries/month | 5 queries |
| Workers | 100k req/day | static + API |
| KV | 1k writes/day | sessions only |

---

## Languages

7 locales configured; only `en` is enabled by default. Toggle from `/keystatic/languages`.

| Locale | Code | Status |
|--------|------|--------|
| 🇬🇧 English | `en` | �?enabled |
| 🇫🇷 French | `fr` | ⏸️ disabled |
| 🇩🇪 German | `de` | ⏸️ disabled |
| 🇪🇸 Spanish | `es` | ⏸️ disabled |
| 🇵🇹 Portuguese | `pt` | ⏸️ disabled |
| 🇨🇳 Chinese | `zh` | ⏸️ disabled |
| 🇸🇦 Arabic | `ar` | ⏸️ disabled (RTL) |

Language is auto-detected from the config filename (`config.yaml` �?`en`, `config.fr.yaml` �?`fr`). No manual `i18n.language` sync needed. Components read `I18N.language` from `astrowind:config`.

### Adding a new language

1. Create `config.{locale}.yaml` + `navigation.{locale}.yaml`
2. Add entry to `src/data/site/languages.yaml` with `enabled: false`
3. CI/CD auto-discovers from `languages.yaml` �?no workflow edits needed

---

## Admin Panel

Each Worker includes a full admin panel at `/keystatic/`:

| Path | Purpose |
|------|---------|
| `/keystatic` | Dashboard |
| `/keystatic/pages` | Edit page content |
| `/keystatic/navigation` | Navigation menu |
| `/keystatic/branding` | Brand config |
| `/keystatic/posts` | Blog posts |
| `/keystatic/products` | Product data |
| `/keystatic/languages` | Language enable/disable |
| `/keystatic/seo` | SEO & site settings |
| `/keystatic/contact-submissions` | View encrypted submissions |
| `/keystatic/link-refactor` | Bulk URL/name refactor |
| `/keystatic/validate-links` | Link validation sweep |

### First-time setup

1. Visit `/keystatic`, enter admin password
2. Configure GitHub PAT (Fine-grained, `Contents: Read and write`)
3. Token is encrypted in browser cookie

Content changes commit directly to `src/data/` via GitHub API. Next CI build picks them up.

### Fallback chain

1. Locale-specific content
2. English content
3. YAML config defaults

---

## Contact Form

SSR endpoint at `/contact` with:

- Math captcha (HMAC-signed cookie)
- Honeypot anti-bot field
- Rate limit: 5 submissions/IP/hour (in-memory sliding window)
- AES-256-GCM encryption �?`src/data/contact/submissions.enc.json`
- Optional Resend email notification

---

## Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Local dev (default locale) |
| `SITE_LOCALE=fr yarn dev` | Local dev (specific locale) |
| `yarn build` | Production build |
| `SITE_LOCALE=pt yarn build` | Build specific locale |
| `yarn build:all` | Build all enabled locales |
| `yarn preview` | Preview production build |
| `yarn check` | astro check + ESLint + Prettier |
| `yarn fix` | Auto-fix lint issues |

---

## Deployment

### CI/CD (automatic)

Push to `main` triggers GitHub Actions:

1. **check-astro** �?type check + lint
2. **enabled-locales** �?reads `languages.yaml`, builds enabled locales
3. **build-and-deploy** �?builds + deploys each locale to Cloudflare Workers

Domain: `Wavefella-{locale}.theworkvigo.workers.dev`

### Custom domain

Set `CUSTOM_DOMAIN = true` in GitHub Variables. CI maps `{locale}.alluredna.com` �?the Worker (requires `alluredna.com` in Cloudflare).

### Manual deploy

```bash
SITE_LOCALE=en yarn build
cd dist/server
yarn wrangler deploy --name Wavefella-en
```

### Secrets

```bash
echo "your-secret" | yarn wrangler secret put SESSION_SECRET --name Wavefella-en
echo "sk-..." | yarn wrangler secret put OPENAI_API_KEY --name Wavefella-en
```

CI auto-sets `SESSION_SECRET` from GitHub Secrets.

---

## Environment Variables

### GitHub Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | �?| Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | �?| API token (Workers + Vectorize perms) |
| `SESSION_SECRET` | �?| Session encryption |
| `OPENAI_API_KEY` | �?| OpenAI for LLM + embeddings |
| `AI_GATEWAY` | �?| Cloudflare AI Gateway URL |

### GitHub Variables (optional)

| Variable | Purpose |
|----------|---------|
| `CUSTOM_DOMAIN` | Set `true` for custom domain mapping |

---

## Requirements

- **Node.js >= 22.12.0**
- **Yarn 4.x** (corepack managed)
- **Cloudflare account** (Workers + KV + Vectorize)
- **GitHub PAT** (admin panel content saving)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro v6 |
| Styling | Tailwind CSS v4 |
| AI Search | Vectorize (768-dim cosine) |
| LLM | OpenAI / Workers AI (free fallback) |
| Deployment | Cloudflare Workers |
| Adapter | @astrojs/cloudflare |
| Admin | Keystatic (GitHub API-backed) |
| Contact | AES-256-GCM + Resend |
| Data | YAML + MD/MDX + JSON |
