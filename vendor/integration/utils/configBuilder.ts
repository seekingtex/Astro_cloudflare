import merge from 'lodash.merge';

import type { MetaData } from '~/types';

export type Config = {
  site?: SiteConfig;
  metadata?: MetaDataConfig;
  i18n?: I18NConfig;
  apps?: {
    blog?: AppBlogConfig;
    products?: AppProductsConfig;
  };
  ui?: unknown;
  analytics?: unknown;
  siteSettings?: Partial<SiteSettingsConfig>;
};

export interface SiteConfig {
  name: string;
  site?: string;
  base?: string;
  trailingSlash?: boolean;
  googleSiteVerificationId?: string;
}
export interface MetaDataConfig extends Omit<MetaData, 'title'> {
  title?: {
    default: string;
    template: string;
  };
}
export interface I18NConfig {
  language: string;
  textDirection: string;
  dateFormatter?: Intl.DateTimeFormat;
}
export interface AppBlogConfig {
  isEnabled: boolean;
  postsPerPage: number;
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
  post: {
    isEnabled: boolean;
    permalink: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  list: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  category: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  tag: {
    isEnabled: boolean;
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
}
export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id?: string;
      partytown?: boolean;
    };
  };
}

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

export interface UIConfig {
  theme: string;
}

export interface OrganizationConfig {
  name: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export interface SocialLinkConfig {
  platform: string;
  url: string;
}

export interface SiteSettingsConfig {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteUrl: string;
  defaultOgImage: string;
  googleSiteVerificationId: string;
  defaultLocale: string;
  defaultOgType: string;
  defaultRobots: { index: boolean; follow: boolean };
  keywords: string[];
  organization: OrganizationConfig;
  twitter: { handle: string; site: string; cardType: string };
  socialLinks: SocialLinkConfig[];
}

const DEFAULT_SITE_NAME = 'Website';

const getSite = (config: Config) => {
  const _default = {
    name: DEFAULT_SITE_NAME,
    site: undefined,
    base: '/',
    trailingSlash: false,

    googleSiteVerificationId: '',
  };

  return merge({}, _default, config?.site ?? {}) as SiteConfig;
};

const getMetadata = (config: Config) => {
  const siteConfig = getSite(config);

  const _default = {
    title: {
      default: siteConfig?.name || DEFAULT_SITE_NAME,
      template: '%s',
    },
    description: '',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: 'website',
    },
  };

  return merge({}, _default, config?.metadata ?? {}) as MetaDataConfig;
};

const getI18N = (config: Config) => {
  const _default = {
    language: 'en',
    textDirection: 'ltr',
  };

  const value = merge({}, _default, config?.i18n ?? {});

  return value as I18NConfig;
};

const getAppBlog = (config: Config) => {
  const _default = {
    isEnabled: false,
    postsPerPage: 6,
    isRelatedPostsEnabled: false,
    relatedPostsCount: 4,
    post: {
      isEnabled: true,
      permalink: '/blog/%slug%',
      robots: {
        index: true,
        follow: true,
      },
    },
    list: {
      isEnabled: true,
      pathname: 'blog',
      robots: {
        index: true,
        follow: true,
      },
    },
    category: {
      isEnabled: true,
      pathname: 'category',
      robots: {
        index: true,
        follow: true,
      },
    },
    tag: {
      isEnabled: true,
      pathname: 'tag',
      robots: {
        index: false,
        follow: true,
      },
    },
  };

  return merge({}, _default, config?.apps?.blog ?? {}) as AppBlogConfig;
};

const getUI = (config: Config) => {
  const _default = {
    theme: 'system',
  };

  return merge({}, _default, config?.ui ?? {});
};

const getAnalytics = (config: Config) => {
  const _default = {
    vendors: {
      googleAnalytics: {
        id: undefined,
        partytown: true,
      },
    },
  };

  return merge({}, _default, config?.analytics ?? {}) as AnalyticsConfig;
};

const getAppProducts = (config: Config) => {
  const _default = {
    isEnabled: false,
    productsPerPage: 12,
    product: {
      isEnabled: true,
      permalink: '/products/%slug%',
      robots: { index: true, follow: true },
    },
    list: {
      isEnabled: true,
      pathname: 'products',
      robots: { index: true, follow: true },
    },
  };

  return merge({}, _default, config?.apps?.products ?? {}) as AppProductsConfig;
};

const getSiteSettings = (config: Config): SiteSettingsConfig => {
  const siteName = config?.siteSettings?.siteName || config?.site?.name || 'Foida';
  const _default: SiteSettingsConfig = {
    siteName,
    siteTagline: '',
    siteDescription: config?.metadata?.description || '',
    siteUrl: config?.site?.site || 'https://foida.com',
    defaultOgImage:
      (Array.isArray(config?.metadata?.openGraph?.images) && config?.metadata?.openGraph?.images?.[0]?.url) ||
      '',
    googleSiteVerificationId: config?.site?.googleSiteVerificationId || '',
    defaultLocale: config?.metadata?.openGraph?.locale || 'en_US',
    defaultOgType: config?.metadata?.openGraph?.type || 'website',
    defaultRobots: {
      index: config?.metadata?.robots?.index ?? true,
      follow: config?.metadata?.robots?.follow ?? true,
    },
    keywords: config?.metadata?.keywords || [],
    organization: {
      name: siteName,
      logo: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
    twitter: {
      handle: config?.metadata?.twitter?.handle || '',
      site: config?.metadata?.twitter?.site || '',
      cardType: config?.metadata?.twitter?.cardType || 'summary_large_image',
    },
    socialLinks: [],
  };

  return merge({}, _default, config?.siteSettings ?? {}) as SiteSettingsConfig;
};

export default (config: Config) => ({
  SITE: getSite(config),
  I18N: getI18N(config),
  METADATA: getMetadata(config),
  APP_BLOG: getAppBlog(config),
  APP_PRODUCTS: getAppProducts(config),
  UI: getUI(config),
  ANALYTICS: getAnalytics(config),
  SITE_SETTINGS: getSiteSettings(config),
});
