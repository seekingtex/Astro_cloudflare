export interface SectionSpec {
  key: string;
  type:
    | 'hero'
    | 'hero_text'
    | 'hero_carousel'
    | 'features'
    | 'features2'
    | 'features3'
    | 'content'
    | 'steps'
    | 'steps2'
    | 'stats'
    | 'faqs'
    | 'testimonials'
    | 'pricing'
    | 'contact'
    | 'cta'
    | 'featured_products'
    | 'blog_latest'
    | 'map';
  label: string;
}

export interface PageSpec {
  slug: string;
  label: string;
  path: string;
  permalink: string;
  file: string;
  sections: SectionSpec[];
}

export const PAGES: PageSpec[] = [
  {
    slug: 'home',
    label: 'Home',
    path: '/',
    permalink: '/',
    file: 'src/data/pages/home.yaml',
    sections: [
      { key: 'hero', type: 'hero', label: 'Hero Section (static, only used when no carousel)' },
      { key: 'hero_carousel', type: 'hero_carousel', label: 'Hero Carousel (3 switchable slides)' },
      { key: 'features', type: 'features', label: 'Features Section (Why Choose Us)' },
      { key: 'featured_products', type: 'featured_products', label: 'Featured Products Section' },
      { key: 'content_workshop', type: 'features3', label: 'Workshop Content Section' },
      { key: 'steps', type: 'steps', label: 'Steps Section (From Order to Delivery)' },
      { key: 'blog_latest', type: 'blog_latest', label: 'Latest Blog Section' },
      { key: 'faqs', type: 'faqs', label: 'FAQs' },
      { key: 'cta', type: 'cta', label: 'Bottom CTA Section' },
    ],
  },
  {
    slug: 'about',
    label: 'About',
    path: '/about',
    permalink: '/about',
    file: 'src/data/pages/about.yaml',
    sections: [
      { key: 'hero', type: 'hero', label: 'Top Hero' },
      { key: 'stats', type: 'stats', label: 'Statistics' },
      { key: 'features3_what_we_build', type: 'features3', label: 'What we build' },
      { key: 'features3_more', type: 'features3', label: 'More (with image)' },
      { key: 'steps2_values', type: 'steps2', label: 'Our values' },
      { key: 'steps2_milestones', type: 'steps2', label: 'Milestones' },
      { key: 'features2_locations', type: 'features2', label: 'Our locations' },
    ],
  },
  {
    slug: 'services',
    label: 'Services',
    path: '/services',
    permalink: '/services',
    file: 'src/data/pages/services.yaml',
    sections: [
      { key: 'hero', type: 'hero', label: 'Top Hero' },
      { key: 'features2_what_we_do', type: 'features2', label: 'What we do' },
      { key: 'content_service', type: 'content', label: 'Service Details' },
      { key: 'testimonials', type: 'testimonials', label: 'Testimonials' },
      { key: 'cta', type: 'cta', label: 'Bottom CTA' },
    ],
  },
  {
    slug: 'pricing',
    label: 'Pricing',
    path: '/pricing',
    permalink: '/pricing',
    file: 'src/data/pages/pricing.yaml',
    sections: [
      { key: 'hero_text', type: 'hero_text', label: 'Top HeroText' },
      { key: 'pricing_packages', type: 'pricing', label: 'Service Packages' },
      { key: 'features3_included', type: 'features3', label: 'What you get on every build' },
      { key: 'steps_process', type: 'steps', label: 'From quote to delivery' },
      { key: 'faqs', type: 'faqs', label: 'Pricing FAQs' },
      { key: 'cta', type: 'cta', label: 'Bottom CTA' },
    ],
  },
  {
    slug: 'contact',
    label: 'Contact',
    path: '/contact',
    permalink: '/contact',
    file: 'src/data/pages/contact.yaml',
    sections: [
      { key: 'hero_text', type: 'hero_text', label: 'Top HeroText' },
      { key: 'contact_form', type: 'contact', label: 'Contact Form' },
      { key: 'features2_other_ways', type: 'features2', label: 'Other ways to reach us' },
      { key: 'map', type: 'map', label: 'Google Maps Location' },
    ],
  },
  {
    slug: 'news',
    label: 'News',
    path: '/news',
    permalink: '/news',
    file: 'src/data/pages/news.yaml',
    sections: [
      { key: 'hero_text', type: 'hero_text', label: 'Page Header (title, subtitle, tagline)' },
    ],
  },
];

export const PAGE_BY_SLUG: Record<string, PageSpec> = Object.fromEntries(
  PAGES.map((p) => [p.slug, p])
);
