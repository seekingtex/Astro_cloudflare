# Wavefella — Project Documentation

> 项目文档：配置详情、架构要求、开发与部署流程

---

## 1. 项目概述

| 项目 | 值 |
|------|-----|
| **名称** | Wavefella |
| **版本** | 1.0.0-beta.63 |
| **描述** | Wavefella 品牌官网 — 充气船与工程产品制造商 |
| **框架** | Astro v6.4.2 + Tailwind CSS v4 + TypeScript 5.9 |
| **包管理** | Yarn 4.16.0 |
| **Node.js** | >= 22.12.0 |
| **部署平台** | Cloudflare Workers (SSR) |
| **域名** | `alluredna.com` (主域), `{locale}.alluredna.com` (各语言子域) |
| **CMS** | GitHub 文件系统驱动 (GitHub API) |

---

## 2. 多语言架构

### 2.1 支持的语言 (6 个)

| 代码 | 名称 | textDirection | 文件名后缀 |
|------|------|---------------|------------|
| `en` | English | `ltr` | (默认 `config.yaml`) |
| `fr` | Français | `ltr` | `config.fr.yaml` |
| `de` | Deutsch | `ltr` | `config.de.yaml` |
| `es` | Español | `ltr` | `config.es.yaml` |
| `pt` | Português | `ltr` | `config.pt.yaml` |
| `zh` | 中文 | `ltr` | `config.zh.yaml` |

### 2.2 语言数据源

- **唯一数据源**: `src/data/site/languages.yaml` — 所有语言的定义文件
- **自动发现**: `src/utils/locale.ts` 动态从 `languages.yaml` 导入 `AVAILABLE_LOCALES` 数组
- **内容集合**: `src/content.config.ts` 从 `locale.ts` 获取语言列表以生成 Zod schema

### 2.3 每个语言的配置文件

- **站点配置**: `src/config.{locale}.yaml` — SEO 元数据、OpenGraph、博客/产品 app 配置
- **导航**: `src/data/site/navigation.{locale}.yaml` — 翻译后的导航菜单
- **页面内容**: `src/data/pages/{locale}/` — 每个语言对应子目录

### 2.4 语言选择器 URL 模式

- 子域名模式: `{locale}.alluredna.com{path}`
- 语言切换 JS (在 `Header.astro` 中):
  - 检测 `hostname.split('.')` 长度
  - `parts.length >= 3` → 替换第一个子域名为目标 locale
  - `parts.length === 2` (裸域名) → 在数组开头插入 locale 作为子域名
  - 本地开发 (`localhost`) → 路径式切换

---

## 3. 构建与部署

### 3.1 本地开发

```bash
# 安装
yarn install

# 启动开发服务器 (默认 en)
yarn dev

# 指定语言开发
SITE_LOCALE=fr yarn dev
SITE_LOCALE=de yarn dev

# 生产构建
SITE_LOCALE=en yarn build
SITE_LOCALE=zh yarn build

# 预览构建结果
yarn preview

# 检查
yarn check:astro    # TypeScript / Astro 检查
yarn check:eslint   # ESLint
yarn check:prettier # Prettier
yarn check          # 全部
yarn fix            # 自动修复
```

### 3.2 CI/CD 流程 (GitHub Actions)

**文件**: `.github/workflows/actions.yaml`

| 步骤 | 说明 |
|------|------|
| `check-astro` | 运行 `yarn run check:astro` (Node 22) |
| `build-and-deploy` | 6 个 locale 依次构建部署 (`max-parallel: 1` 避免 Cloudflare API 限流) |

**构建矩阵**:
```yaml
matrix:
  locale: [en, fr, de, es, pt, zh]
```

**每个 locale 的部署步骤**:
1. `SITE_LOCALE=${{ matrix.locale }} yarn build`
2. 生成 `wrangler.ci.json` (剥离绝对路径)
3. 查询 KV namespace ID 并注入
4. `wrangler deploy --name wavefella-${{ matrix.locale }}`
5. 设置 `SESSION_SECRET` secret
6. 如果 `vars.CUSTOM_DOMAIN == 'true'`: 创建/更新域名映射 `{locale}.alluredna.com → wavefella-{locale}`

**注意事项**:
- `check-astro` 必须通过才能触发布署
- 只有 `push` 到 `main` 才执行部署 (PR 只运行 `check-astro`)
- 自定义域名映射需要先在 GitHub Repo Settings → Variables 中设置 `CUSTOM_DOMAIN = true`

### 3.3 环境变量 / Secrets

| 变量 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `SITE_LOCALE` | env (CI) | CI matrix | 构建时语言选择 (en/fr/de/es/pt/zh) |
| `SESSION_SECRET` | Secret | Cloudflare Worker | 会话加密密钥 (必须设置) |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | GitHub Actions | Cloudflare 账户 ID |
| `CLOUDFLARE_API_TOKEN` | Secret | GitHub Actions | Cloudflare API Token |
| `CUSTOM_DOMAIN` | Variable | GitHub Repo | 设为 `true` 启用自定义域名映射 |
| `NODE_VERSION` | env | `22` | 构建环境 Node 版本 |

**开发环境**: `.dev.vars` (本地开发用，不上传到 Cloudflare)

---

## 4. 配置系统

### 4.1 站点配置

**文件**: `src/config.yaml` (英语), `src/config.{locale}.yaml` (其他语言)

由 `vendor/integration/index.ts` 加载，作为 Vite 虚拟模块 `astrowind:config` 导出。

**导出对象**:
- `SITE` — 站点基本信息 (name, site, base, trailingSlash)
- `I18N` — 国际化 (language, textDirection) — **语言从文件名自动推断**
- `METADATA` — SEO 元数据 (title, description, keywords, OpenGraph, Twitter)
- `APP_BLOG` — 博客配置
- `APP_PRODUCTS` — 产品配置
- `UI` — UI 主题配置
- `ANALYTICS` — 分析工具配置

**Key 约束**: `config.{locale}.yaml` 文件名的 locale 优先级最高 — `vendor/integration/index.ts` 中的 `deriveLocale()` 自动设置 `I18N.language`，覆盖文件中可能存在的 `language` 字段。

### 4.2 导航配置

**文件**: `src/data/site/navigation.yaml` (英语), `src/data/site/navigation.{locale}.yaml` (其他语言)

Astro Vite 别名机制: 当 `locale !== 'en'` 时，`~/data/site/navigation.yaml` 被别名为 `./src/data/site/navigation.{locale}.yaml`

### 4.3 品牌配置

**文件**: `src/data/site/branding.yaml`

```yaml
site_name: Wavefella                  # 全局站点名称
logo_image: ''
logo_alt: Wavefella logo
copyright: © {year} {site_name} · All rights reserved.
whatsapp_number: '+8613305324192'
whatsapp_default_message: Hello, I would like to inquire about a product.
contact_email_to: info@wavefella.com
contact_email_provider: none
contact_from_email: contact@wavefella.com
contact_from_name: Admin
contact_resend_api_key: Aa123456#      # Resend API Key (占位符，需替换)
contact_submissions_pat: ''            # GitHub PAT (需在后台设置)
```

**注意**: `site_name` 是全局的 — 修改它会同时影响所有 6 个语言 Worker。

### 4.4 页面定义

**文件**: `src/data/site/pages.yaml`

定义了 6 个标准页面的 section/widget 映射:

| 页面 slug | 文件路径 | 区域/路由 |
|-----------|----------|-----------|
| `home` | `src/data/pages/home.yaml` | `/` |
| `about` | `src/data/pages/about.yaml` | `/about` |
| `services` | `src/data/pages/services.yaml` | `/services` |
| `pricing` | `src/data/pages/pricing.yaml` | `/pricing` |
| `contact` | `src/data/pages/contact.yaml` | `/contact` |
| `news` | `src/data/pages/news.yaml` | `/news` |

**自动发现**: `GET /api/admin/pages` 也会自动发现 `src/data/pages/` 中未在 `pages.yaml` 定义的 `.yaml` 文件。

### 4.5 联系表单文本

**文件**: `src/data/site/contact-form-text.yaml`

所有 6 个语言的表单标签、按钮、消息、验证码、同意声明集中管理。添加新语言只需在每个字段下增加一个语言键。

### 4.6 国家/地区数据

**文件**: `src/data/site/countries.yaml`

195 个国家，包含 6 种语言的名称翻译和电话区号。

---

## 5. 管理后台

### 5.1 访问路径

`https://{domain}/keystatic` → 管理后台首页

### 5.2 导航标签

| 标签 | 路径 | 功能 |
|------|------|------|
| Dashboard | `/keystatic` | 概览、使用指南 |
| Posts | `/keystatic/posts` | 博客文章列表、新增、编辑、删除 |
| Products | `/keystatic/products` | 产品列表、新增、编辑、删除 |
| Pages | `/keystatic/pages` | 页面内容管理 (已定义 + 自动发现) |
| Navigation | `/keystatic/navigation` | 导航菜单编辑器 |
| Branding | `/keystatic/branding` | 品牌信息编辑 |
| Submissions | `/keystatic/contact-submissions` | 加密的联系表单提交记录 |
| Languages | `/keystatic/languages` | 语言管理 (增删、同步 CI) |
| Links | `/keystatic/link-refactor` | URL/名称批量替换 |

### 5.3 认证流程

1. **登录**: `/api/auth/login` — POST `{ username, password }`
2. **会话验证**: 使用 `node:crypto` HMAC-SHA256 签名，24 小时过期
3. **GitHub PAT**: `/keystatic/github-token` — 设置后存储在加密 cookie 中
4. **凭据来源**:
   - 环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` (优先)
   - `src/data/admin-auth.json` (支持 `passwordHash`)
   - 默认: `Admin / Aa123456#`

### 5.4 API 端点

**路径**: `src/pages/api/admin/` (所有端点需 admin 认证)

| 端点 | 方法 | 功能 |
|------|------|------|
| `_guard.ts` | — | 认证守卫模块 |
| `create.ts` | POST | 创建 post/product (.md) |
| `update.ts` | POST | 更新文件 (.md/.yaml) |
| `delete.ts` | POST | 删除文件 |
| `read.ts` | GET | 读取文件内容 |
| `list.ts` | GET | 列出目录文件 (支持 `prefix`) |
| `pages.ts` | GET/POST | 页面定义列表 / 新页面创建 |
| `languages.ts` | GET/POST/DELETE | 语言管理 |
| `save-token.ts` | POST | 保存 GitHub PAT |
| `validate-links.ts` | POST | 扫描内部死链接 |
| `refactor/scan.ts` | POST | 扫描旧 URL/名称 |
| `refactor/apply.ts` | POST | 应用替换 |

其他:
- `POST /api/auth/login` — 登录
- `POST /api/auth/logout` — 登出
- `POST /api/auth/change-password` — 修改密码
- `POST /api/contact` — 联系表单提交

---

## 6. 内容管理

### 6.1 页面内容 (Pages)

**路径**: `src/data/pages/{slug}.yaml`

每个 YAML 文件包含多个 section 的数据。section 类型定义在 `src/data/site/pages.yaml` 中。

**可用 section 类型**:

| 类型 | 组件 | 用途 |
|------|------|------|
| `hero` | `HeroForm` | 图片 + 标题 + 按钮 |
| `hero_text` | `HeroTextForm` | 纯文字标题区 |
| `hero_carousel` | `HeroCarouselForm` | 自动轮播 (幻灯片) |
| `features` | `FeaturesForm` | 特性网格 (图标 + 标题 + 说明) |
| `features2` | `Features2Form` | 双列特性 |
| `features3` | `Features3Form` | 带图片 + CTA 的特性 |
| `content` | `ContentForm` | 内容区 (文字 + 图片) |
| `steps` | `StepsForm` | 步骤流程 (编号) |
| `steps2` | `Steps2Form` | 步骤流 (交替) |
| `stats` | `StatsForm` | 统计数据 |
| `faqs` | `FaqsForm` | FAQ |
| `testimonials` | `TestimonialsForm` | 客户评价 |
| `pricing` | `PricingForm` | 定价方案 |
| `contact` | `ContactFormSection` | 联系表单 |
| `cta` | `CtaForm` | Call to Action |
| `featured_products` | `FeaturedProductsForm` | 精选产品 |
| `blog_latest` | `BlogLatestForm` | 最新博客 |
| `map` | `MapForm` | Google 地图 |

### 6.2 博客文章 (Posts)

**路径**: `src/data/post/{slug}.md` 或 `.mdx`

**Frontmatter**:
```yaml
publishDate: 2023-01-02T00:00:00Z
title: Post Title
excerpt: Short description
image: https://...
category: CategoryName
tags: [tag1, tag2]
author: AuthorName
draft: false
metadata:
  title: SEO Title (optional)
  description: SEO Description (optional)
  canonical: https://...
  openGraph: { ... }
  twitter: { ... }
```

### 6.3 产品 (Products)

**路径**: `src/data/product/{slug}.md`

**Frontmatter**:
```yaml
publishDate: 2023-06-01T00:00:00Z
title: Product Name
sku: SKU-001
summary: Short summary
description: Full description
image: https://...
gallery:
  - url: https://...
    alt: Description
category: rib | inflatable | accessory | service
tags: [tag1, tag2]
specs:
  - label: Length
    value: 4.5m
price:
  amount: '3500'
  currency: USD
  note: Starting from
inStock: true
featured: true
draft: false
metadata: { ... }
```

### 6.4 自动发现机制

| 内容类型 | 目录 | 是否自动发现 | 创建方式 |
|----------|------|------------|----------|
| **Posts** | `src/data/post/` | ✅ 文件列表 + frontmatter 解析 | 后台 "+ New Post" |
| **Products** | `src/data/product/` | ✅ 文件列表 + frontmatter 解析 | 后台 "+ New Product" |
| **Pages** | `src/data/pages/` | ✅ 已定义 + 自动发现的 YAML | 后台 "+ New Page" (定义 sections) |

新创建的页面会自动在所有语言的 `src/data/pages/{locale}/` 下生成占位文件。

---

## 7. 联系表单系统

### 7.1 工作流程

1. 用户填写表单 (含数学验证码)
2. `POST /api/contact` — Cloudflare Worker SSR 端点
3. 验证 HMAC 签名的验证码 cookie (`src/lib/contact-captcha.ts`)
4. 限流检查 (5 次/IP/小时) (`src/lib/rate-limit.ts`)
5. 蜜罐字段检查 (隐藏的 `email_confirm` 输入)
6. 验证 + 清洗 10 个字段
7. **AES-256-GCM 加密** 载荷 (`src/lib/contact-crypto.ts`)
8. 通过 GitHub API 追加到 `src/data/contact/submissions.enc.json`
9. 通过 **Resend API** 发送邮件 (Reply-To = 提交者)
10. 加密记录可在 `/keystatic/contact-submissions` 查看和解密

### 7.2 安全

- **Rate limit**: 内存滑动窗口 `contact:<ip>`
- **Honeypot**: 隐藏字段，bot 填写后模拟成功但不实际提交
- **加密**: AES-256-GCM，密钥从 `SESSION_SECRET` 派生
- **GitHub PAT**: 使用 Fine-grained PAT，仅 `Contents: Read and write` 权限

### 7.3 表单配置

联系表单的字段在 `src/data/pages/contact.yaml` 中定义，标签通过 `src/data/site/contact-form-text.yaml` 按语言覆盖。

---

## 8. 重要决策与约定

### 8.1 语言从文件名自动推断

`vendor/integration/index.ts` 的 `deriveLocale()` 函数解析 `config.{locale}.yaml` 文件名，自动设置 `I18N.language`。这意味着:
- 配置文件中不需要（也不应该）有 `i18n.language` 字段
- `process.env.SITE_LOCALE` 在组件中不可靠 — 使用 `I18N.language` 代替

### 8.2 `site_name` 是全局的

尽管有 6 个语言版本，`site_name` 在 `branding.yaml` 中是单一全局值。修改它会影响所有 Worker。

### 8.3 添加新语言的步骤

1. 在 `languages.yaml` 中添加语言定义 (code, name, locale, textDirection)
2. 通过后台管理界面创建语言 → 自动:
   - 创建 `config.{locale}.yaml`
   - 创建 `navigation.{locale}.yaml`
   - 复制 English 页面到 `src/data/pages/{locale}/`
   - 更新 CI workflow 的 matrix
3. `src/utils/locale.ts` 和 `src/content.config.ts` 自动发现新语言 (下次构建时)

### 8.4 实际域名 vs 开发域名

| 环境 | 访问方式 |
|------|----------|
| 生产 | `https://{locale}.alluredna.com` (子域名) |
| 开发 | `http://localhost:4321` (路径式 `/fr/...`) |
| Worker 原始 | `https://wavefella-{locale}.theworkvigo.workers.dev` |

### 8.5 语言切换器的 URL 构造

- **子域名模式** (生产): `{locale}.alluredna.com{path}`
- **裸域名处理**: `alluredna.com` → 拆分为 `[alluredna, com]` → 插入 locale 作为新子域名 → `{locale}.alluredna.com{path}`
- **`www` 处理**: `www.alluredna.com` → 替换 `www` 为 locale → `{locale}.alluredna.com{path}`

---

## 9. 项目结构

```
Astro_cloudflare/
├── .github/workflows/actions.yaml   # CI/CD
├── src/
│   ├── assets/styles/tailwind.css    # Tailwind v4 配置
│   ├── components/
│   │   ├── admin/                    # 管理后台表单组件
│   │   │   ├── page-schemas.ts       # 页面定义 schema
│   │   │   ├── PostForm.astro        # 文章表单
│   │   │   ├── ProductForm.astro     # 产品表单
│   │   │   └── sections/             # 18 个 section 表单
│   │   ├── widgets/                  # 前端页面组件
│   │   │   ├── Header.astro          # 头部 (含语言切换器)
│   │   │   ├── Contact.astro         # 联系表单
│   │   │   ├── Hero.astro            # Hero section
│   │   │   └── ...                   # 其他 widget
│   ├── content/
│   │   ├── homepage/index.json       # Keystatic 内容
│   │   ├── about/index.json
│   │   ├── ...
│   │   └── config.ts                 # Content Collections schema
│   ├── data/
│   │   ├── post/                     # 博客文章 .md
│   │   ├── product/                  # 产品 .md
│   │   ├── pages/                    # 页面 YAML 内容
│   │   │   ├── home.yaml
│   │   │   ├── {locale}/             # 多语言页面内容
│   │   │   └── ...
│   │   ├── site/
│   │   │   ├── languages.yaml        # 语言定义 (唯一数据源)
│   │   │   ├── pages.yaml            # 页面定义 (sections)
│   │   │   ├── branding.yaml         # 品牌配置
│   │   │   ├── navigation.yaml       # 导航 (英语)
│   │   │   ├── countries.yaml        # 国家列表
│   │   │   ├── contact-form-text.yaml # 表单文本
│   │   │   └── navigation.{locale}.yaml # 多语言导航
│   │   └── contact/
│   │       └── submissions.enc.json  # 加密的联系表单提交
│   ├── lib/
│   │   ├── auth.ts                   # 会话认证
│   │   ├── github.ts                 # GitHub API 客户端
│   │   ├── markdown.ts               # Markdown 解析/序列化
│   │   ├── contact-captcha.ts        # 验证码 (HMAC)
│   │   ├── contact-crypto.ts         # AES-256-GCM 加密
│   │   ├── rate-limit.ts             # 内存限流
│   │   └── token-store.ts            # PAT cookie 管理
│   ├── pages/
│   │   ├── index.astro               # 首页
│   │   ├── about.astro               # 关于
│   │   ├── services.astro            # 服务
│   │   ├── pricing.astro             # 定价
│   │   ├── contact.astro             # 联系 (SSR)
│   │   ├── news/                     # 博客
│   │   ├── products/                 # 产品
│   │   ├── keystatic/                # 管理后台页面
│   │   │   ├── index.astro           # Dashboard
│   │   │   ├── pages/                # 页面编辑器
│   │   │   ├── posts/                # 文章管理
│   │   │   ├── products/             # 产品管理
│   │   │   └── ...
│   │   └── api/                      # API 端点
│   │       ├── admin/                # 管理 API
│   │       ├── contact.ts            # 联系表单提交
│   │       └── auth/                 # 认证 API
│   └── utils/
│       ├── locale.ts                 # 国际化工具
│       └── ...
├── vendor/integration/index.ts       # Astro 集成 (配置加载)
├── astro.config.ts                   # Astro 配置
├── wrangler.toml                     # Cloudflare Workers 配置
├── tsconfig.json
├── package.json
└── .dev.vars                         # 开发环境变量 (不上传到 Cloudflare)
```

---

## 10. 故障排除

### 10.1 CI/CD 失败

- **`check-astro` 失败**: 运行 `yarn run check:astro` 本地排查。通常是 TypeScript 类型错误。
- **部署失败**: 检查 Cloudflare API Token 权限、Worker 名称冲突、KV namespace 是否存在。
- **自定义域名失败**: 确保 `vars.CUSTOM_DOMAIN = true` 已设置，DNS 已指向 Cloudflare。

### 10.2 语言切换器问题

- 检查 `hostname` vs `host` — 生产环境用 `hostname` 构造子域名 URL
- 本地开发 (`localhost`) 使用路径式切换
- `www.alluredna.com` 有 3 段 → 替换 `www` 为 locale
- `alluredna.com` 有 2 段 → 插入 locale 为新子域名

### 10.3 联系表单

- **邮件不发送**: 检查 `branding.yaml` 中的 `contact_resend_api_key`
- **提交不保存**: 检查 GitHub PAT 是否有效 (通过 /keystatic/github-token 设置)
- **验证码不通过**: 检查 `SESSION_SECRET` 是否设置 (开发环境 `.dev.vars`、生产环境 Cloudflare Secrets)

### 10.4 管理后台无法登录

- 默认凭据: `Admin / Aa123456#`
- 修改后如有 `passwordHash`，使用 `node -e "require('./src/lib/auth').hashPassword('YOUR_PASSWORD')"` 生成新 hash
- 环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 会覆盖文件配置
