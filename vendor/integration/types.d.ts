declare module 'astrowind:config' {
  import type { SiteConfig, I18NConfig, MetaDataConfig, AppBlogConfig, UIConfig, AnalyticsConfig } from './config';

  export interface AppProductsConfig {
    isEnabled: boolean;
    productsPerPage: number;
    product: {
      isEnabled: boolean;
      permalink: string;
      robots: { index: boolean; follow: boolean };
    };
    list: {
      isEnabled: boolean;
      pathname: string;
      robots: { index: boolean; follow: boolean };
    };
  }

  export const SITE: SiteConfig;
  export const I18N: I18NConfig;
  export const METADATA: MetaDataConfig;
  export const APP_BLOG: AppBlogConfig;
  export const APP_PRODUCTS: AppProductsConfig;
  export const UI: UIConfig;
  export const ANALYTICS: AnalyticsConfig;
}
