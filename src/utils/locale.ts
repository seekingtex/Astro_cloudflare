import { getEntry } from 'astro:content';
import { I18N } from 'astrowind:config';

export const AVAILABLE_LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'zh'] as const;
export type Locale = (typeof AVAILABLE_LOCALES)[number];

export function getLocale(): Locale {
  return (I18N?.language as Locale) || 'en';
}

type DeepRecord = Record<string, unknown>;

export async function getLocaleData<T = DeepRecord>(
  collection: string,
  id: string,
  fallbackData?: T
): Promise<T> {
  const locale = getLocale();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = await getEntry(collection as any, id);
    const ksData = ((entry?.data as Record<string, unknown>)?.[locale] ||
      (entry?.data as Record<string, unknown>)?.['en'] ||
      {}) as T;
    if (Object.keys(ksData as Record<string, unknown>).length > 0) {
      return ksData;
    }
  } catch {
    // fallback
  }
  return fallbackData ?? ({} as T);
}
