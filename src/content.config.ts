import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

const productSpecSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

const productPriceSchema = z
  .object({
    amount: z.string().optional(),
    currency: z.string().optional(),
    note: z.string().optional(),
  })
  .optional();

const productImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
});

const productCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/product' }),
  schema: z.object({
    publishDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    sku: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),

    gallery: z.array(productImageSchema).optional(),

    category: z.enum(['rib', 'inflatable', 'accessory', 'service']).optional(),
    tags: z.array(z.string()).optional(),

    specs: z.array(productSpecSchema).optional(),
    price: productPriceSchema,

    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),

    metadata: metadataDefinition(),
  }),
});

export const collections = {
  post: postCollection,
  product: productCollection,
};
