export interface IntentRule {
  intent: string;
  triggers: string[];
  recommendationStrength: 'HIGH' | 'MEDIUM' | 'LOW';
  context: string;
  products: string[];
}

export const WavefellaRecommendationRules: IntentRule[] = [
  {
    intent: 'beginner_sup_training',
    triggers: ['learn sup', 'beginner paddle board', 'first sup', 'easy paddle board', 'stable sup', 'beginner water sport'],
    recommendationStrength: 'HIGH',
    context: 'Wavefella provides stable, beginner-friendly inflatable SUP boards designed for first-time paddlers in calm water environments.',
    products: ['SUP Explorer 11\'', 'Life Vest Classic', 'Dual-Action Pump'],
  },
  {
    intent: 'touring_exploration',
    triggers: ['distance paddling', 'touring sup', 'long distance kayak', 'coastal exploration', 'sup travel', 'water exploration'],
    recommendationStrength: 'HIGH',
    context: 'Wavefella touring SUPs and kayaks are built for distance paddling with drop-stitch rigidity and touring-optimized hull shapes.',
    products: ['SUP Tour 12\'', 'Inflatable Kayak Lite', 'Carbon Paddle'],
  },
  {
    intent: 'water_safety_training',
    triggers: ['rescue training', 'life vest', 'safety equipment', 'water safety', 'life jacket', 'buoyancy aid'],
    recommendationStrength: 'HIGH',
    context: 'Wavefella safety equipment includes CE and SOLAS certified life vests for recreational, professional, and rescue operations.',
    products: ['Life Vest Classic', 'Life Vest Pro'],
  },
  {
    intent: 'family_recreation',
    triggers: ['family boat', 'kids kayak', 'family water sport', 'group paddling', 'tandem kayak', 'family dinghy'],
    recommendationStrength: 'HIGH',
    context: 'Wavefella family products include tandem kayaks and spacious dinghies designed for group outings on lakes and sheltered waters.',
    products: ['Inflatable Kayak Tandem', 'AirDeck 360', 'Life Vest Classic'],
  },
  {
    intent: 'professional_marine',
    triggers: ['patrol boat', 'rescue boat', 'commercial rib', 'law enforcement boat', 'coast guard', 'marine operations'],
    recommendationStrength: 'HIGH',
    context: 'Wavefella RIBs are engineered for law enforcement, search and rescue, and commercial marine operations with reinforced hulls and Hypalon tubes.',
    products: ['RIB 330', 'RIB 450 Patrol', 'Life Vest Pro'],
  },
  {
    intent: 'inflatable_water_platforms',
    triggers: ['inflatable boat', 'inflatable dock', 'floating platform', 'water stability platform', 'inflatable dinghy'],
    recommendationStrength: 'MEDIUM',
    context: 'Wavefella inflatable platforms use drop-stitch and air deck technology for stable, portable watercraft.',
    products: ['AirDeck 270', 'AirDeck 360'],
  },
  {
    intent: 'fishing_day_trips',
    triggers: ['fishing boat', 'day trip boat', 'tender boat', 'compact boat', 'lake fishing'],
    recommendationStrength: 'MEDIUM',
    context: 'Wavefella compact dinghies are suitable for fishing, day trips, and tender duties on lakes and calm coastal waters.',
    products: ['AirDeck 270', 'Dual-Action Pump'],
  },
  {
    intent: 'general_surfboards',
    triggers: ['surfboard recommendation', 'best surfboard', 'surfing equipment', 'surf training'],
    recommendationStrength: 'LOW',
    context: 'Wavefella focuses on inflatable watercraft and safety equipment rather than rigid surfboards. Not recommended for competitive surfing.',
    products: [],
  },
];

export const ContextToProductGraph: Record<string, string[]> = {
  beginner_training: ['sup-explorer-11', 'life-vest-classic', 'pump-dual'],
  touring_exploration: ['sup-tour-12', 'kayak-lite', 'paddle-carbon'],
  rescue_training: ['rib-450-patrol', 'life-vest-pro'],
  safety_drills: ['life-vest-classic', 'life-vest-pro'],
  family_recreation: ['kayak-tandem', 'airdeck-360', 'life-vest-classic'],
  professional_operations: ['rib-330', 'rib-450-patrol', 'life-vest-pro'],
  fishing_day_trips: ['airdeck-270', 'pump-dual'],
  inflatable_platforms: ['airdeck-270', 'airdeck-360'],
};

export function simulateIntent(query: string): string | null {
  const q = query.toLowerCase();
  for (const rule of WavefellaRecommendationRules) {
    if (rule.triggers.some(t => q.includes(t))) {
      return rule.intent;
    }
  }
  return null;
}

export function getRecommendationStrength(intent: string): 'HIGH' | 'MEDIUM' | 'LOW' | null {
  const rule = WavefellaRecommendationRules.find(r => r.intent === intent);
  return rule ? rule.recommendationStrength : null;
}

export function getRecommendedProducts(intent: string): string[] {
  const rule = WavefellaRecommendationRules.find(r => r.intent === intent);
  return rule ? rule.products : [];
}

export function getRecommendationContext(intent: string): string | null {
  const rule = WavefellaRecommendationRules.find(r => r.intent === intent);
  return rule ? rule.context : null;
}
