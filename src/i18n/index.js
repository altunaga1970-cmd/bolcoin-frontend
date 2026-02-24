import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// EN
import enCommon from './locales/en/common.json';
import enGames from './locales/en/games.json';
import enWallet from './locales/en/wallet.json';
import enValidation from './locales/en/validation.json';

// ES
import esCommon from './locales/es/common.json';
import esGames from './locales/es/games.json';
import esWallet from './locales/es/wallet.json';
import esValidation from './locales/es/validation.json';

// PT
import ptCommon from './locales/pt/common.json';
import ptGames from './locales/pt/games.json';
import ptWallet from './locales/pt/wallet.json';
import ptValidation from './locales/pt/validation.json';

// FR
import frCommon from './locales/fr/common.json';
import frGames from './locales/fr/games.json';
import frWallet from './locales/fr/wallet.json';
import frValidation from './locales/fr/validation.json';

// ZH
import zhCommon from './locales/zh/common.json';
import zhGames from './locales/zh/games.json';
import zhWallet from './locales/zh/wallet.json';
import zhValidation from './locales/zh/validation.json';

// JA
import jaCommon from './locales/ja/common.json';
import jaGames from './locales/ja/games.json';
import jaWallet from './locales/ja/wallet.json';
import jaValidation from './locales/ja/validation.json';

// KO
import koCommon from './locales/ko/common.json';
import koGames from './locales/ko/games.json';
import koWallet from './locales/ko/wallet.json';
import koValidation from './locales/ko/validation.json';

// RU
import ruCommon from './locales/ru/common.json';
import ruGames from './locales/ru/games.json';
import ruWallet from './locales/ru/wallet.json';
import ruValidation from './locales/ru/validation.json';

// AR
import arCommon from './locales/ar/common.json';
import arGames from './locales/ar/games.json';
import arWallet from './locales/ar/wallet.json';
import arValidation from './locales/ar/validation.json';

// HI
import hiCommon from './locales/hi/common.json';
import hiGames from './locales/hi/games.json';
import hiWallet from './locales/hi/wallet.json';
import hiValidation from './locales/hi/validation.json';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7', dir: 'ltr' },
  { code: 'es', name: 'Espa\u00f1ol', flag: '\uD83C\uDDEA\uD83C\uDDF8', dir: 'ltr' },
  { code: 'pt', name: 'Portugu\u00eas', flag: '\uD83C\uDDE7\uD83C\uDDF7', dir: 'ltr' },
  { code: 'fr', name: 'Fran\u00e7ais', flag: '\uD83C\uDDEB\uD83C\uDDF7', dir: 'ltr' },
  { code: 'zh', name: '\u4E2D\u6587', flag: '\uD83C\uDDE8\uD83C\uDDF3', dir: 'ltr' },
  { code: 'ja', name: '\u65E5\u672C\u8A9E', flag: '\uD83C\uDDEF\uD83C\uDDF5', dir: 'ltr' },
  { code: 'ko', name: '\uD55C\uAD6D\uC5B4', flag: '\uD83C\uDDF0\uD83C\uDDF7', dir: 'ltr' },
  { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\uD83C\uDDF7\uD83C\uDDFA', dir: 'ltr' },
  { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\uD83C\uDDF8\uD83C\uDDE6', dir: 'rtl' },
  { code: 'hi', name: '\u0939\u093F\u0928\u094D\u0926\u0940', flag: '\uD83C\uDDEE\uD83C\uDDF3', dir: 'ltr' }
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, games: enGames, wallet: enWallet, validation: enValidation },
      es: { common: esCommon, games: esGames, wallet: esWallet, validation: esValidation },
      pt: { common: ptCommon, games: ptGames, wallet: ptWallet, validation: ptValidation },
      fr: { common: frCommon, games: frGames, wallet: frWallet, validation: frValidation },
      zh: { common: zhCommon, games: zhGames, wallet: zhWallet, validation: zhValidation },
      ja: { common: jaCommon, games: jaGames, wallet: jaWallet, validation: jaValidation },
      ko: { common: koCommon, games: koGames, wallet: koWallet, validation: koValidation },
      ru: { common: ruCommon, games: ruGames, wallet: ruWallet, validation: ruValidation },
      ar: { common: arCommon, games: arGames, wallet: arWallet, validation: arValidation },
      hi: { common: hiCommon, games: hiGames, wallet: hiWallet, validation: hiValidation },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_language',
    },
  });

// Set document direction based on language
const updateDirection = (lng) => {
  const lang = LANGUAGES.find(l => l.code === lng) || LANGUAGES[0];
  document.documentElement.dir = lang.dir;
  document.documentElement.lang = lang.code;
};

updateDirection(i18n.language);
i18n.on('languageChanged', updateDirection);

export default i18n;
