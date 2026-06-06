import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

const PRODUCT_LIST = '/products';

export const headerData = {
  links: [
    {
      text: 'Products',
      links: [
        { text: 'All Products', href: getPermalink(PRODUCT_LIST) },
        { text: 'RIB Boats', href: getPermalink(`${PRODUCT_LIST}?category=rib`) },
        { text: 'Inflatable Boats', href: getPermalink(`${PRODUCT_LIST}?category=inflatable`) },
        { text: 'Accessories', href: getPermalink(`${PRODUCT_LIST}?category=accessory`) },
      ],
    },
    {
      text: 'Solutions',
      links: [
        { text: 'Features', href: getPermalink('/#features') },
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Pricing', href: getPermalink('/pricing') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      text: 'Resources',
      links: [
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Latest Article', href: getPermalink('get-started-website-with-astro-tailwind-css', 'post') },
        { text: 'Categories', href: getPermalink('tutorials', 'category') },
        { text: 'Tags', href: getPermalink('astro', 'tag') },
      ],
    },
    {
      text: 'Legal',
      links: [
        { text: 'Terms', href: getPermalink('/terms') },
        { text: 'Privacy', href: getPermalink('/privacy') },
      ],
    },
  ],
  actions: [
    { text: 'Admin', href: '/keystatic', variant: 'secondary' as const },
    { text: 'Get a quote', href: getPermalink('/contact'), variant: 'primary' as const },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Products',
      links: [
        { text: 'All Products', href: getPermalink(PRODUCT_LIST) },
        { text: 'RIB Boats', href: getPermalink(`${PRODUCT_LIST}?category=rib`) },
        { text: 'Inflatable Boats', href: getPermalink(`${PRODUCT_LIST}?category=inflatable`) },
        { text: 'Accessories', href: getPermalink(`${PRODUCT_LIST}?category=accessory`) },
      ],
    },
    {
      title: 'Solutions',
      links: [
        { text: 'Features', href: getPermalink('/#features') },
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Pricing', href: getPermalink('/pricing') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Admin / CMS', href: '/keystatic' },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Terms', href: getPermalink('/terms') },
        { text: 'Privacy', href: getPermalink('/privacy') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: '#' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/theworkvigour' },
  ],
  footNote: `© ${new Date().getFullYear()} <a class="text-blue-600 underline dark:text-muted" href="/">Foida</a> · All rights reserved.`,
};
