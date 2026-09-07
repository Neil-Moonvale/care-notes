import {es} from './es.js';
import { zh, en } from './i18n.js';

// Add complete, reviewed dictionaries here. User-entered notes are never translated.
export const LANGUAGES = Object.freeze([
  { code:'es', label:'Español', locale:'es', direction:'ltr', messages:es },
  { code: 'zh', label: '简体中文', locale: 'zh-CN', direction: 'ltr', messages: zh },
  { code: 'en', label: 'English', locale: 'en', direction: 'ltr', messages: en },
]);
export function chooseLanguage(preferences = []) {
  for (const value of preferences) {
    if (typeof value !== 'string') continue;
    const code = value.toLowerCase().split(/[-_]/)[0];
    if (LANGUAGES.some(l => l.code === code)) return code;
  }
  return 'en';
}
export function languageInfo(code) { return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === 'en'); }
export function getLabels(code) { const language = languageInfo(code); return { ...en, ...language.messages, locale: language.locale }; }
