import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { formatDuration, formatNumber } from '../ui/format'
import { englishTranslations } from './locales/en'

export const FALLBACK_LANGUAGE = 'en'

/** Adding a language is one file plus one entry here. */
export const availableTranslations = {
  en: { translation: englishTranslations },
}

export const i18n = i18next.use(initReactI18next)

void i18n.init({
  resources: availableTranslations,
  lng: FALLBACK_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
})

/** Formatted here, not by the systems that record the event. */
i18n.services.formatter?.add('duration', (value) => formatDuration(Number(value)))
i18n.services.formatter?.add('compactNumber', (value) => formatNumber(Number(value)))

/** Values interpolated into a message; `count` also selects the plural form. */
export type TranslationValues = Record<string, string | number>
