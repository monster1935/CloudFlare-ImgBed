import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './zh-CN.json'
import en from './en.json'

const LOCALE_KEY = 'app-locale'

function getStoredLocale(): string {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'zh-CN' || stored === 'en') return stored
  return 'zh-CN'
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: getStoredLocale(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
})

export function setLocale(locale: string) {
  i18n.changeLanguage(locale)
  localStorage.setItem(LOCALE_KEY, locale)
  document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en'
}

export { LOCALE_KEY, getStoredLocale }
export default i18n
