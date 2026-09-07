# Translation guide / 翻译指南

Shipped UI languages: Simplified Chinese (`zh`), English (`en`) and Spanish (`es`). Other-language notes remain verbatim; classification quality outside Chinese/English is not validated.

1. Create a complete dictionary matching the English keys in `dist/i18n.js`. Separate modules are welcome.
2. Register it in `dist/locales.js` with code, native label, locale, direction and messages. Extend locale matching explicitly for script/region distinctions when required.
3. Preserve placeholders such as `{n}` and the distinction between unknown, reported, uncertain and reviewed. Reviewed does not mean clinically confirmed.
4. Add new modules to service-worker assets and increment the cache version.
5. Run `npm test`; shipped dictionaries are checked for key and placeholder parity. Add relevant locale matching coverage.
6. Obtain native-language review of consent, backup, deletion, source labels and summaries. Check long text, narrow screens and 200% zoom. RTL languages need full layout review; setting `dir` alone is insufficient.

Never translate or overwrite original records when changing interface language. Optional record translation would need separate consent and preserved originals. Machine translation alone is insufficient for medical terminology and privacy copy.

中文：新增语言需要完整字典、语言注册、缓存更新、键名与占位符检查，以及重要文案的母语审核。界面翻译不能覆盖原始记录。当前没有宣称其他语言已完成验证。

## Current interface languages

Simplified Chinese, English and Spanish. Include the help dictionary, episode labels and fictional examples when adding a language. Demo edits are stored per language. Switching language must not translate or overwrite personal notes. Spanish translations have not received independent native-language or clinical review. Local classification patterns remain Chinese/English; interface availability is not semantic-model language validation.
