import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * AI Sitemap — returns structured page index for the AI knowledge base.
 *
 * This endpoint is consumed by the indexing pipeline (seed-vectorize.js)
 * to discover all pages that should be chunked and embedded.
 *
 * Extend this as new sections are added to the site.
 */
export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any).runtime?.env;

  // Static page list — these form the AI knowledge base
  const pages = [
    // Main
    { id: 'home', url: '/', title: 'Wavefella — Premium Inflatables', section: 'main', type: 'page' },
    { id: 'about', url: '/about', title: 'About Wavefella', section: 'main', type: 'page' },
    { id: 'services', url: '/services', title: 'Services', section: 'main', type: 'page' },
    { id: 'pricing', url: '/pricing', title: 'Pricing', section: 'main', type: 'page' },
    { id: 'contact', url: '/contact', title: 'Contact', section: 'main', type: 'page' },

    // Products
    { id: 'products', url: '/products', title: 'Products Overview', section: 'products', type: 'product' },
    { id: 'product-rib-330', url: '/products/rib-330', title: 'RIB 330', section: 'products', type: 'product' },
    { id: 'product-rib-450-patrol', url: '/products/rib-450-patrol', title: 'RIB 450 Patrol', section: 'products', type: 'product' },
    { id: 'product-airdeck-270', url: '/products/airdeck-270', title: 'AirDeck 270', section: 'products', type: 'product' },
    { id: 'product-airdeck-360', url: '/products/airdeck-360', title: 'AirDeck 360', section: 'products', type: 'product' },
    { id: 'product-oars-pump-set', url: '/products/oars-pump-set', title: 'Oars & Pump Set', section: 'products', type: 'product' },

    // R&D Center
    { id: 'randd', url: '/randdcenter', title: 'R&D Center', section: 'randd', type: 'technology' },
    { id: 'randd-pvc-fabric', url: '/randdcenter/pvc-fabric-lab', title: 'PVC Fabric Lab', section: 'randd', type: 'technology' },
    { id: 'randd-hull-engineering', url: '/randdcenter/hull-engineering', title: 'Hull Engineering Studio', section: 'randd', type: 'technology' },
    { id: 'randd-rf-welding', url: '/randdcenter/rf-welding', title: 'RF Welding Center', section: 'randd', type: 'technology' },
    { id: 'randd-prototype', url: '/randdcenter/prototype-workshop', title: 'Prototype Workshop', section: 'randd', type: 'technology' },
    { id: 'randd-hydrodynamic', url: '/randdcenter/hydrodynamic-test-tank', title: 'Hydrodynamic Test Tank', section: 'randd', type: 'technology' },
    { id: 'randd-quality', url: '/randdcenter/quality-inspection-lab', title: 'Quality & Inspection Lab', section: 'randd', type: 'technology' },

    // Legal
    { id: 'privacy', url: '/privacy', title: 'Privacy Policy', section: 'legal', type: 'page' },
    { id: 'terms', url: '/terms', title: 'Terms and Conditions', section: 'legal', type: 'page' },
    { id: 'disclaimer', url: '/disclaimer', title: 'Disclaimer', section: 'legal', type: 'page' },
  ];

  const result = {
    version: '1.0',
    generated: new Date().toISOString(),
    total: pages.length,
    pages: pages.map((p) => ({
      ...p,
      updated: new Date().toISOString(),
    })),
  };

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
