/**
 * Country + language data for the locale picker.
 * Each country has a flag, name, and list of supported locales.
 */
import type { LocaleCode } from '../utils/i18n';

export interface CountryEntry {
  /** ISO 3166-1 alpha-2 country code */
  code: string;
  flag: string;
  name: string;
  nameFr: string;
  /** Locales available for this country */
  locales: Array<{ code: LocaleCode; label: string; labelFr: string }>;
}

export const COUNTRIES: CountryEntry[] = [
  {
    code: 'US',
    flag: '🇺🇸',
    name: 'United States',
    nameFr: 'États-Unis',
    locales: [{ code: 'en-US', label: 'English (US)', labelFr: 'Anglais (É.-U.)' }],
  },
  {
    code: 'FR',
    flag: '🇫🇷',
    name: 'France',
    nameFr: 'France',
    locales: [{ code: 'fr-FR', label: 'French', labelFr: 'Français' }],
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    name: 'United Kingdom',
    nameFr: 'Royaume-Uni',
    locales: [{ code: 'en-US', label: 'English (UK)', labelFr: 'Anglais (R.-U.)' }],
  },
  {
    code: 'CA',
    flag: '🇨🇦',
    name: 'Canada',
    nameFr: 'Canada',
    locales: [
      { code: 'en-US', label: 'English', labelFr: 'Anglais' },
      { code: 'fr-FR', label: 'French', labelFr: 'Français' },
    ],
  },
  {
    code: 'BE',
    flag: '🇧🇪',
    name: 'Belgium',
    nameFr: 'Belgique',
    locales: [
      { code: 'fr-FR', label: 'French', labelFr: 'Français' },
      { code: 'en-US', label: 'English', labelFr: 'Anglais' },
    ],
  },
  {
    code: 'CH',
    flag: '🇨🇭',
    name: 'Switzerland',
    nameFr: 'Suisse',
    locales: [
      { code: 'fr-FR', label: 'French', labelFr: 'Français' },
      { code: 'en-US', label: 'English', labelFr: 'Anglais' },
    ],
  },
  {
    code: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    nameFr: 'Australie',
    locales: [{ code: 'en-US', label: 'English (AU)', labelFr: 'Anglais (Aus.)' }],
  },
  {
    code: 'NZ',
    flag: '🇳🇿',
    name: 'New Zealand',
    nameFr: 'Nouvelle-Zélande',
    locales: [{ code: 'en-US', label: 'English (NZ)', labelFr: 'Anglais (N.-Z.)' }],
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    name: 'Germany',
    nameFr: 'Allemagne',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'ES',
    flag: '🇪🇸',
    name: 'Spain',
    nameFr: 'Espagne',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'IT',
    flag: '🇮🇹',
    name: 'Italy',
    nameFr: 'Italie',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    name: 'Japan',
    nameFr: 'Japon',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'IN',
    flag: '🇮🇳',
    name: 'India',
    nameFr: 'Inde',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'BR',
    flag: '🇧🇷',
    name: 'Brazil',
    nameFr: 'Brésil',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'MX',
    flag: '🇲🇽',
    name: 'Mexico',
    nameFr: 'Mexique',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
  {
    code: 'ZA',
    flag: '🇿🇦',
    name: 'South Africa',
    nameFr: 'Afrique du Sud',
    locales: [{ code: 'en-US', label: 'English', labelFr: 'Anglais' }],
  },
];
