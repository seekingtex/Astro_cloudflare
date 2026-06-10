import { config, singleton, fields } from '@keystatic/core';

const AVAILABLE_LOCALES = {
  en: '🇺🇸 English',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  es: '🇪🇸 Español',
  pt: '🇵🇹 Português',
  zh: '🇨🇳 简体中文',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMultilingualSchema = (fieldSchema: Record<string, any>): Record<string, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const [code, label] of Object.entries(AVAILABLE_LOCALES)) {
    result[code] = fields.object(fieldSchema, { label });
  }
  return result;
};

const actionFields = {
  text: fields.text({ label: 'Text' }),
  href: fields.url({ label: 'URL' }),
  variant: fields.select({
    label: 'Variant',
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Tertiary', value: 'tertiary' },
    ],
    defaultValue: 'primary',
  }),
  icon: fields.text({ label: 'Icon (e.g. tabler:shopping-bag)' }),
};

const itemFields = {
  title: fields.text({ label: 'Title' }),
  description: fields.text({ label: 'Description', multiline: true }),
  icon: fields.text({ label: 'Icon' }),
};

const imageFields = {
  src: fields.url({ label: 'Image URL' }),
  alt: fields.text({ label: 'Alt text' }),
};

const hero = {
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  actions: fields.array(fields.object(actionFields), { label: 'Actions', itemLabel: (p) => p.fields.text.value || 'Action' }),
  image: fields.object(imageFields, { label: 'Image' }),
};

const heroText = {
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  content: fields.text({ label: 'Content (HTML)', multiline: true }),
};

const heroCarousel = {
  autoplay_interval: fields.integer({ label: 'Autoplay interval (ms)', defaultValue: 5000 }),
  slides: fields.array(
    fields.object({
      image: fields.object(imageFields, { label: 'Image' }),
      tagline: fields.text({ label: 'Tagline' }),
      title: fields.text({ label: 'Title', multiline: true }),
      subtitle: fields.text({ label: 'Subtitle', multiline: true }),
      actions: fields.array(fields.object(actionFields), { label: 'Actions', itemLabel: (p) => p.fields.text.value || 'Action' }),
    }),
    { label: 'Slides', itemLabel: (p) => p.fields.tagline.value || 'Slide' }
  ),
};

const features = {
  id: fields.text({ label: 'Section ID' }),
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  columns: fields.select({ label: 'Columns', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], defaultValue: '3' }),
  items: fields.array(fields.object(itemFields), { label: 'Items', itemLabel: (p) => p.fields.title.value || 'Item' }),
};

const features2 = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  tagline: fields.text({ label: 'Tagline' }),
  columns: fields.select({ label: 'Columns', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], defaultValue: '3' }),
  items: fields.array(fields.object(itemFields), { label: 'Items', itemLabel: (p) => p.fields.title.value || 'Item' }),
};

const features3 = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  tagline: fields.text({ label: 'Tagline' }),
  columns: fields.select({ label: 'Columns', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], defaultValue: '3' }),
  isBeforeContent: fields.checkbox({ label: 'Before content' }),
  isAfterContent: fields.checkbox({ label: 'After content' }),
  items: fields.array(fields.object(itemFields), { label: 'Items', itemLabel: (p) => p.fields.title.value || 'Item' }),
  image: fields.object(imageFields, { label: 'Image' }),
};

const content = {
  isReversed: fields.checkbox({ label: 'Reverse layout' }),
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  content: fields.text({ label: 'Content (HTML)', multiline: true }),
  items: fields.array(fields.object(itemFields), { label: 'Items', itemLabel: (p) => p.fields.title.value || 'Item' }),
  image: fields.object(imageFields, { label: 'Image' }),
};

const steps = {
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  isReversed: fields.checkbox({ label: 'Reverse layout' }),
  items: fields.array(fields.object(itemFields), { label: 'Steps', itemLabel: (p) => p.fields.title.value || 'Step' }),
  image: fields.object(imageFields, { label: 'Image' }),
};

const steps2 = {
  tagline: fields.text({ label: 'Tagline' }),
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  isReversed: fields.checkbox({ label: 'Reverse layout' }),
  items: fields.array(fields.object(itemFields), { label: 'Items', itemLabel: (p) => p.fields.title.value || 'Item' }),
};

const stats = {
  title: fields.text({ label: 'Title' }),
  subtitle: fields.text({ label: 'Subtitle' }),
  columns: fields.select({ label: 'Columns', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], defaultValue: '4' }),
  stats: fields.array(
    fields.object({
      title: fields.text({ label: 'Title' }),
      amount: fields.text({ label: 'Amount' }),
      icon: fields.text({ label: 'Icon' }),
    }),
    { label: 'Statistics', itemLabel: (p) => p.fields.title.value || 'Stat' }
  ),
};

const faqs = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  columns: fields.select({ label: 'Columns', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }], defaultValue: '2' }),
  items: fields.array(fields.object(itemFields), { label: 'FAQ Items', itemLabel: (p) => p.fields.title.value || 'Question' }),
};

const testimonials = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  testimonials: fields.array(
    fields.object({
      testimonial: fields.text({ label: 'Testimonial text', multiline: true }),
      name: fields.text({ label: 'Name' }),
      job: fields.text({ label: 'Job / Title' }),
      image: fields.object(imageFields, { label: 'Image' }),
    }),
    { label: 'Testimonials', itemLabel: (p) => p.fields.name.value || 'Testimonial' }
  ),
};

const pricing = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  prices: fields.array(
    fields.object({
      title: fields.text({ label: 'Plan title' }),
      subtitle: fields.text({ label: 'Plan subtitle' }),
      price: fields.text({ label: 'Price' }),
      period: fields.text({ label: 'Period' }),
      hasRibbon: fields.checkbox({ label: 'Show ribbon' }),
      ribbonTitle: fields.text({ label: 'Ribbon text' }),
      items: fields.array(
        fields.object({ description: fields.text({ label: 'Description' }) }),
        { label: 'Features', itemLabel: () => 'Feature' }
      ),
      callToAction: fields.object({
        text: fields.text({ label: 'Button text' }),
        href: fields.url({ label: 'Link URL' }),
        target: fields.text({ label: 'Link target' }),
      }, { label: 'Call to Action' }),
    }),
    { label: 'Pricing tiers', itemLabel: (p) => p.fields.title.value || 'Tier' }
  ),
};

const cta = {
  title: fields.text({ label: 'Title', multiline: true }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  actions: fields.array(fields.object(actionFields), { label: 'Actions', itemLabel: (p) => p.fields.text.value || 'Action' }),
};

const featuredProducts = {
  id: fields.text({ label: 'Section ID' }),
  title: fields.text({ label: 'Title' }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  linkText: fields.text({ label: 'Link text' }),
  linkUrl: fields.url({ label: 'Link URL' }),
};

const blogLatest = {
  title: fields.text({ label: 'Title' }),
  information: fields.text({ label: 'Information text', multiline: true }),
};

const contactForm = {
  id: fields.text({ label: 'Section ID' }),
  title: fields.text({ label: 'Title' }),
  subtitle: fields.text({ label: 'Subtitle', multiline: true }),
  email_to: fields.text({ label: 'Email to' }),
  submit_button: fields.text({ label: 'Submit button text' }),
  success_message: fields.text({ label: 'Success message', multiline: true }),
  error_message: fields.text({ label: 'Error message', multiline: true }),
  default_country_code: fields.text({ label: 'Default country code' }),
  captcha: fields.object({ label: fields.text({ label: 'Captcha label' }) }, { label: 'Captcha' }),
  fields: fields.array(
    fields.object({
      name: fields.text({ label: 'Field name' }),
      label: fields.text({ label: 'Field label' }),
      type: fields.select({ label: 'Type', options: [{ label: 'Text', value: 'text' }, { label: 'Email', value: 'email' }, { label: 'Tel', value: 'tel' }, { label: 'Textarea', value: 'textarea' }], defaultValue: 'text' }),
      row: fields.select({ label: 'Row', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7', value: '7' }], defaultValue: '1' }),
      rows: fields.integer({ label: 'Textarea rows' }),
      withCountryCode: fields.checkbox({ label: 'Show country code picker' }),
    }),
    { label: 'Form fields', itemLabel: (p) => p.fields.label.value || 'Field' }
  ),
};

const map = {
  title: fields.text({ label: 'Title' }),
  subtitle: fields.text({ label: 'Subtitle' }),
  address: fields.text({ label: 'Address', multiline: true }),
  embedUrl: fields.url({ label: 'Google Maps embed URL' }),
  latitude: fields.text({ label: 'Latitude' }),
  longitude: fields.text({ label: 'Longitude' }),
  zoom: fields.integer({ label: 'Zoom level', defaultValue: 15 }),
};

export default config({
  storage: {
    kind: 'github',
    repo: 'theworkvigour/Astro_cloudflare',
  },
  singletons: {
    homepage: singleton({
      label: '🏠 Homepage',
      path: 'src/content/homepage/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero: fields.object(hero, { label: 'Hero Section' }),
        hero_carousel: fields.object(heroCarousel, { label: 'Hero Carousel' }),
        features: fields.object(features, { label: 'Features' }),
        featured_products: fields.object(featuredProducts, { label: 'Featured Products' }),
        content_workshop: fields.object(content, { label: 'Workshop Content' }),
        steps: fields.object(steps, { label: 'Steps' }),
        blog_latest: fields.object(blogLatest, { label: 'Blog Latest' }),
        faqs: fields.object(faqs, { label: 'FAQs' }),
        cta: fields.object(cta, { label: 'CTA' }),
      }),
    }),

    about: singleton({
      label: '👥 About',
      path: 'src/content/about/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero: fields.object(hero, { label: 'Top Hero' }),
        stats: fields.object(stats, { label: 'Statistics' }),
        features3_what_we_build: fields.object(features3, { label: 'What We Build' }),
        features3_more: fields.object(features3, { label: 'More' }),
        steps2_values: fields.object(steps2, { label: 'Our Values' }),
        steps2_milestones: fields.object(steps2, { label: 'Milestones' }),
        features2_locations: fields.object(features2, { label: 'Locations' }),
      }),
    }),

    services: singleton({
      label: '🔧 Services',
      path: 'src/content/services/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero: fields.object(hero, { label: 'Top Hero' }),
        features2_what_we_do: fields.object(features2, { label: 'What We Do' }),
        content_service: fields.object(content, { label: 'Service Content' }),
        testimonials: fields.object(testimonials, { label: 'Testimonials' }),
        cta: fields.object(cta, { label: 'Bottom CTA' }),
      }),
    }),

    pricing: singleton({
      label: '💰 Pricing',
      path: 'src/content/pricing/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero_text: fields.object(heroText, { label: 'Top HeroText' }),
        pricing_packages: fields.object(pricing, { label: 'Service Packages' }),
        features3_included: fields.object(features3, { label: "What's Included" }),
        steps_process: fields.object(steps, { label: 'Process Steps' }),
        faqs: fields.object(faqs, { label: 'Pricing FAQs' }),
        cta: fields.object(cta, { label: 'Bottom CTA' }),
      }),
    }),

    contact: singleton({
      label: '📬 Contact',
      path: 'src/content/contact/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero_text: fields.object(heroText, { label: 'Top HeroText' }),
        contact_form: fields.object(contactForm, { label: 'Contact Form' }),
        features2_other_ways: fields.object(features2, { label: 'Other Ways to Reach Us' }),
        map: fields.object(map, { label: 'Map Location' }),
      }),
    }),

    news: singleton({
      label: '📰 News',
      path: 'src/content/news/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        hero_text: fields.object(heroText, { label: 'Page Header' }),
      }),
    }),

    global: singleton({
      label: '🌐 Global Settings',
      path: 'src/content/global/index',
      format: { data: 'json' },
      schema: {
        en: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇺🇸 English' }),
        fr: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇫🇷 Français' }),
        de: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇩🇪 Deutsch' }),
        es: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇪🇸 Español' }),
        pt: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇵🇹 Português' }),
        zh: fields.object({
          site_name: fields.text({ label: 'Site Name' }),
          site_tagline: fields.text({ label: 'Site Tagline' }),
          site_description: fields.text({ label: 'Site Description', multiline: true }),
          copyright: fields.text({ label: 'Copyright text (HTML)' }),
        }, { label: '🇨🇳 简体中文' }),
      },
    }),

    navigation: singleton({
      label: '🧭 Navigation & Footer',
      path: 'src/content/navigation/index',
      format: { data: 'json' },
      schema: createMultilingualSchema({
        header: fields.object({
          topBar: fields.array(
            fields.object({
              text: fields.text({ label: 'Link Text' }),
              href: fields.url({ label: 'URL' }),
            }),
            { label: 'Top Bar Links', itemLabel: (p) => p.fields.text.value || 'Link' }
          ),
          links: fields.array(
            fields.object({
              text: fields.text({ label: 'Group Name' }),
              links: fields.array(
                fields.object({
                  text: fields.text({ label: 'Link Text' }),
                  href: fields.url({ label: 'URL' }),
                }),
                { label: 'Sub Links', itemLabel: (p) => p.fields.text.value || 'Link' }
              ),
            }),
            { label: 'Navigation Groups', itemLabel: (p) => p.fields.text.value || 'Group' }
          ),
          actions: fields.array(fields.object(actionFields), { label: 'Right Buttons', itemLabel: (p) => p.fields.text.value || 'Action' }),
        }, { label: 'Header' }),
        footer: fields.object({
          links: fields.array(
            fields.object({
              title: fields.text({ label: 'Category Title' }),
              links: fields.array(
                fields.object({
                  text: fields.text({ label: 'Link Text' }),
                  href: fields.url({ label: 'URL' }),
                }),
                { label: 'Links', itemLabel: (p) => p.fields.text.value || 'Link' }
              ),
            }),
            { label: 'Footer Categories', itemLabel: (p) => p.fields.title.value || 'Category' }
          ),
          secondaryLinks: fields.array(
            fields.object({
              text: fields.text({ label: 'Link Text' }),
              href: fields.url({ label: 'URL' }),
            }),
            { label: 'Footer Secondary Links', itemLabel: (p) => p.fields.text.value || 'Link' }
          ),
          socialLinks: fields.array(
            fields.object({
              ariaLabel: fields.text({ label: 'Aria Label' }),
              icon: fields.text({ label: 'Icon (e.g. tabler:brand-x)' }),
              href: fields.url({ label: 'URL' }),
            }),
            { label: 'Social Links', itemLabel: (p) => p.fields.ariaLabel.value || 'Social' }
          ),
          footNote: fields.text({ label: 'Copyright note (HTML)', multiline: true }),
        }, { label: 'Footer' }),
      }),
    }),
  },
});
