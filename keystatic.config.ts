import { config, fields, collection, singleton } from '@keystatic/core';

const isProd = import.meta.env.PROD;

export default config({
  storage: isProd
    ? { kind: 'github', repo: 'theworkvigour/astro_Tina-CMS' }
    : { kind: 'local' },

  ui: { brand: { name: 'Foida 管理系统' } },

  collections: {
    post: collection({
      label: '博客文章 / Blog',
      slugField: 'title',
      path: 'src/data/post/*',
      format: { data: 'yaml' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: '文章标题 / Title' } }),
        publishDate: fields.date({ label: '发布日期 / Publish Date', defaultValue: { kind: 'today' } }),
        updateDate: fields.date({ label: '更新日期 / Update Date' }),
        draft: fields.checkbox({ label: '草稿 / Draft', defaultValue: false }),
        excerpt: fields.text({ label: '文章摘要 / Excerpt', multiline: true }),
        image: fields.text({ label: '封面图片URL / Cover Image URL' }),
        category: fields.text({ label: '分类 / Category' }),
        tags: fields.array(fields.text({ label: '标签 / Tag' }), {
          label: '标签 / Tags',
          itemLabel: (props) => props.value || '标签',
        }),
        author: fields.text({ label: '作者 / Author' }),
        metadata: fields.object(
          {
            title: fields.text({ label: 'SEO 标题 / Meta Title' }),
            description: fields.text({ label: 'SEO 描述 / Meta Description', multiline: true }),
            canonical: fields.text({ label: 'Canonical URL' }),
            ignoreTitleTemplate: fields.checkbox({ label: '忽略标题模板 / Ignore Title Template' }),
            robots: fields.object(
              {
                index: fields.checkbox({ label: 'Index', defaultValue: true }),
                follow: fields.checkbox({ label: 'Follow', defaultValue: true }),
              },
              { label: 'Robots' }
            ),
            openGraph: fields.object(
              {
                url: fields.text({ label: 'OG URL' }),
                siteName: fields.text({ label: 'OG Site Name' }),
                locale: fields.text({ label: 'OG Locale' }),
                type: fields.text({ label: 'OG Type (e.g. website, article)' }),
                images: fields.array(
                  fields.object({
                    url: fields.text({ label: '图片URL / Image URL' }),
                    width: fields.integer({ label: '宽度 / Width' }),
                    height: fields.integer({ label: '高度 / Height' }),
                  }),
                  { label: 'OG Images' }
                ),
              },
              { label: 'Open Graph' }
            ),
            twitter: fields.object(
              {
                handle: fields.text({ label: 'Twitter Handle' }),
                site: fields.text({ label: 'Twitter Site' }),
                cardType: fields.text({ label: 'Card Type (summary, summary_large_image)' }),
              },
              { label: 'Twitter Card' }
            ),
          },
          { label: 'SEO / 元数据' }
        ),
        content: fields.mdx({ label: '正文 / Content' }),
      },
    }),

    product: collection({
      label: '产品 / Products',
      slugField: 'title',
      path: 'src/data/product/*',
      format: { data: 'yaml' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: '产品名称 / Product Name' } }),
        sku: fields.text({ label: '产品编号 / SKU' }),
        summary: fields.text({ label: '一句话简介 / Summary', multiline: true }),
        description: fields.text({ label: '详细描述 / Description', multiline: true }),
        image: fields.text({ label: '主图URL / Main Image URL' }),
        gallery: fields.array(
          fields.object({
            url: fields.text({ label: '图片URL / Image URL' }),
            alt: fields.text({ label: '图片说明 / Alt' }),
          }),
          { label: '产品图册 / Gallery', itemLabel: (props) => props.value.alt || props.value.url || '图片' }
        ),
        category: fields.select(
          [
            { label: 'RIB 动力艇 / RIB', value: 'rib' },
            { label: '充气艇 / Inflatable', value: 'inflatable' },
            { label: '配件 / Accessories', value: 'accessory' },
            { label: '服务 / Service', value: 'service' },
          ],
          { label: '产品分类 / Category', defaultValue: 'inflatable' }
        ),
        tags: fields.array(fields.text({ label: '标签 / Tag' }), {
          label: '标签 / Tags',
          itemLabel: (props) => props.value || '标签',
        }),
        specs: fields.array(
          fields.object({
            label: fields.text({ label: '规格名 / Spec Name' }),
            value: fields.text({ label: '规格值 / Spec Value' }),
          }),
          { label: '技术规格 / Specifications', itemLabel: (props) => `${props.value.label}: ${props.value.value}` || '规格' }
        ),
        price: fields.object(
          {
            amount: fields.text({ label: '价格 / Price' }),
            currency: fields.text({ label: '货币 / Currency', defaultValue: 'USD' }),
            note: fields.text({ label: '价格说明 / Note' }),
          },
          { label: '价格 / Price' }
        ),
        inStock: fields.checkbox({ label: '现货 / In Stock', defaultValue: true }),
        featured: fields.checkbox({ label: '首页推荐 / Featured', defaultValue: false }),
        publishDate: fields.date({ label: '上架日期 / Publish Date', defaultValue: { kind: 'today' } }),
        draft: fields.checkbox({ label: '草稿 / Draft', defaultValue: false }),
        metadata: fields.object(
          {
            title: fields.text({ label: 'SEO 标题 / Meta Title' }),
            description: fields.text({ label: 'SEO 描述 / Meta Description', multiline: true }),
            canonical: fields.text({ label: 'Canonical URL' }),
            ignoreTitleTemplate: fields.checkbox({ label: '忽略标题模板 / Ignore Title Template' }),
            robots: fields.object(
              {
                index: fields.checkbox({ label: 'Index', defaultValue: true }),
                follow: fields.checkbox({ label: 'Follow', defaultValue: true }),
              },
              { label: 'Robots' }
            ),
            openGraph: fields.object(
              {
                url: fields.text({ label: 'OG URL' }),
                siteName: fields.text({ label: 'OG Site Name' }),
                locale: fields.text({ label: 'OG Locale' }),
                type: fields.text({ label: 'OG Type' }),
                images: fields.array(
                  fields.object({
                    url: fields.text({ label: '图片URL / Image URL' }),
                    width: fields.integer({ label: '宽度 / Width' }),
                    height: fields.integer({ label: '高度 / Height' }),
                  }),
                  { label: 'OG Images' }
                ),
              },
              { label: 'Open Graph' }
            ),
            twitter: fields.object(
              {
                handle: fields.text({ label: 'Twitter Handle' }),
                site: fields.text({ label: 'Twitter Site' }),
                cardType: fields.text({ label: 'Card Type' }),
              },
              { label: 'Twitter Card' }
            ),
          },
          { label: 'SEO / 元数据' }
        ),
        content: fields.mdx({ label: '产品详情 / Details' }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: '网站设置 / Site Settings',
      path: 'keystatic/site/',
      schema: {
        siteName: fields.text({ label: '站点名称 / Site Name', defaultValue: 'Foida' }),
        siteTagline: fields.text({ label: '站点副标题 / Tagline' }),
        siteDescription: fields.text({ label: '站点描述 / Default Meta Description', multiline: true }),
        siteUrl: fields.url({ label: '站点 URL / Site URL (Canonical)', defaultValue: 'https://foida.com' }),
        defaultOgImage: fields.text({ label: '默认 OG 图片 URL / Default OG Image URL' }),
        googleSiteVerificationId: fields.text({ label: 'Google Search Console 验证码 / Google Verification' }),
        defaultLocale: fields.text({ label: '默认语言区域 / Default Locale', defaultValue: 'en_US' }),
        defaultOgType: fields.select(
          [
            { label: 'website', value: 'website' },
            { label: 'article', value: 'article' },
            { label: 'product', value: 'product' },
            { label: 'profile', value: 'profile' },
          ],
          { label: '默认 OG 类型 / Default OG Type', defaultValue: 'website' }
        ),
        defaultRobots: fields.object(
          {
            index: fields.checkbox({ label: '允许收录 / Index', defaultValue: true }),
            follow: fields.checkbox({ label: '允许追踪链接 / Follow', defaultValue: true }),
          },
          { label: '默认 Robots / Default Robots' }
        ),
        keywords: fields.array(fields.text({ label: '关键词 / Keyword' }), {
          label: '默认关键词 / Default Keywords',
          itemLabel: (props) => props.value || '关键词',
        }),
        organization: fields.object(
          {
            name: fields.text({ label: '组织名称 / Organization Name' }),
            logo: fields.text({ label: 'Logo URL / Logo URL' }),
            contactEmail: fields.text({ label: '联系邮箱 / Contact Email' }),
            contactPhone: fields.text({ label: '联系电话 / Contact Phone' }),
            address: fields.text({ label: '联系地址 / Address', multiline: true }),
          },
          { label: '组织信息 / Organization' }
        ),
        twitter: fields.object(
          {
            handle: fields.text({ label: 'Twitter Handle (e.g. @foida)' }),
            site: fields.text({ label: 'Twitter Site (e.g. @foida)' }),
            cardType: fields.select(
              [
                { label: 'summary', value: 'summary' },
                { label: 'summary_large_image', value: 'summary_large_image' },
              ],
              { label: 'Card Type', defaultValue: 'summary_large_image' }
            ),
          },
          { label: 'Twitter Card' }
        ),
        socialLinks: fields.array(
          fields.object({
            platform: fields.text({ label: '平台 / Platform (e.g. Facebook, LinkedIn, YouTube)' }),
            url: fields.text({ label: 'URL / Profile URL' }),
          }),
          {
            label: '社交链接 / Social Links',
            itemLabel: (props) => `${props.value.platform || '平台'}: ${props.value.url || ''}`,
          }
        ),
      },
    }),
  },
});
