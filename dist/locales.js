import {es} from './es.js';
import {fr} from './fr.js';
import {ja} from './ja.js';
import {ko} from './ko.js';
import { zh, en } from './i18n.js';

// Add complete, reviewed dictionaries here. User-entered notes are never translated.
export const LANGUAGES = Object.freeze([
  { code: 'zh', label: '简体中文', locale: 'zh-CN', direction: 'ltr', messages: zh },
  { code: 'en', label: 'English', locale: 'en', direction: 'ltr', messages: en },
  { code: 'es', label: 'Español', locale: 'es', direction: 'ltr', messages: es },
  { code: 'fr', label: 'Français', locale: 'fr', direction: 'ltr', messages: fr },
  { code: 'ja', label: '日本語', locale: 'ja', direction: 'ltr', messages: ja },
  { code: 'ko', label: '한국어', locale: 'ko', direction: 'ltr', messages: ko },
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
