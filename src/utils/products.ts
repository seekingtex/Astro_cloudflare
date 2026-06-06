import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Product, ProductCategory } from '~/types';
import { APP_PRODUCTS } from 'astrowind:config';
import { cleanSlug, PRODUCT_PERMALINK_PATTERN } from './permalinks';

const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  rib: 'RIB Boats',
  inflatable: 'Inflatable Boats',
  accessory: 'Accessories',
  service: 'Services',
};

export const productCategoryLabels = PRODUCT_CATEGORY_LABELS;

const getNormalizedProduct = async (product: CollectionEntry<'product'>): Promise<Product> => {
  const { id, data } = product;
  const { Content, remarkPluginFrontmatter } = await render(product);

  const slug = cleanSlug(id);

  const {
    publishDate: rawPublishDate = new Date(),
    title,
    sku,
    summary,
    description,
    image,
    gallery = [],
    category: rawCategory,
    tags: rawTags = [],
    specs = [],
    price,
    inStock = true,
    featured = false,
    draft = false,
    metadata = {},
  } = data;

  const publishDate = new Date(rawPublishDate);

  const category: ProductCategory | undefined = rawCategory;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  const permalink = PRODUCT_PERMALINK_PATTERN.replace('%slug%', slug);

  return {
    id,
    slug,
    permalink,
    publishDate,
    title,
    sku,
    summary,
    description,
    image,
    gallery,
    category,
    categoryLabel: category ? PRODUCT_CATEGORY_LABELS[category] : undefined,
    tags,
    specs,
    price,
    inStock,
    featured,
    draft,
    metadata,
    Content,
    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

let _products: Array<Product> | undefined;
let _publicProducts: Array<Product> | undefined;

const loadAll = async (): Promise<Array<Product>> => {
  if (_products) return _products;
  const products = await getCollection('product');
  _products = await Promise.all(products.map(getNormalizedProduct));
  return _products;
};

const loadPublic = async (): Promise<Array<Product>> => {
  if (_publicProducts) return _publicProducts;
  const all = await loadAll();
  _publicProducts = all
    .filter((p) => !p.draft)
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf());
  return _publicProducts;
};

export const isProductsEnabled = () => Boolean(APP_PRODUCTS?.isEnabled);
export const isProductsListEnabled = () => Boolean(APP_PRODUCTS?.list?.isEnabled);
export const isProductRouteEnabled = () => Boolean(APP_PRODUCTS?.product?.isEnabled);
export const productsPerPage = () => APP_PRODUCTS?.productsPerPage || 12;
export const productListRobots = () => APP_PRODUCTS?.list?.robots ?? { index: true, follow: true };
export const productRobots = () => APP_PRODUCTS?.product?.robots ?? { index: true, follow: true };

export interface ProductQuery {
  featured?: boolean;
  category?: ProductCategory;
  limit?: number;
}

export const getProducts = async (query: ProductQuery = {}): Promise<Array<Product>> => {
  let products = await loadPublic();
  if (query.featured) products = products.filter((p) => p.featured);
  if (query.category) products = products.filter((p) => p.category === query.category);
  if (query.limit) products = products.slice(0, query.limit);
  return products;
};

export const findProductsBySlugs = async (slugs: Array<string>): Promise<Array<Product>> => {
  if (!Array.isArray(slugs)) return [];
  const products = await loadPublic();
  return slugs.reduce<Array<Product>>((acc, slug) => {
    products.forEach((p) => {
      if (p.slug === slug) acc.push(p);
    });
    return acc;
  }, []);
};

export const findProductBySlug = async (slug: string): Promise<Product | undefined> => {
  const products = await loadPublic();
  return products.find((p) => p.slug === slug);
};

export const findRelatedProducts = async (product: Product, max = 3): Promise<Array<Product>> => {
  const products = await loadPublic();
  const tagSet = new Set(product.tags?.map((t) => t.slug) ?? []);
  return products
    .filter((p) => p.slug !== product.slug)
    .map((p) => {
      let score = 0;
      if (p.category && product.category && p.category === product.category) score += 5;
      p.tags?.forEach((t) => {
        if (tagSet.has(t.slug)) score += 1;
      });
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.p);
};

export const getProductCategories = async (): Promise<Array<{ slug: ProductCategory; title: string; count: number }>> => {
  const products = await loadPublic();
  const map = new Map<ProductCategory, number>();
  products.forEach((p) => {
    if (p.category) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
  });
  return Array.from(map.entries()).map(([slug, count]) => ({
    slug,
    title: PRODUCT_CATEGORY_LABELS[slug],
    count,
  }));
};

export const getStaticPathsProduct = async () => {
  if (!isProductsEnabled() || !isProductRouteEnabled()) return [];
  const products = await loadPublic();
  return products.flatMap((p) => ({
    params: { slug: p.slug },
    props: { product: p },
  }));
};
