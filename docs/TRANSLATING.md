# Translation guide / 翻译指南

Shipped UI languages on the current feature branch: Simplified Chinese (`zh`), English (`en`), Spanish (`es`), French (`fr`), Japanese (`ja`) and Korean (`ko`). User-entered notes remain verbatim. Interface availability does **not** mean local classification quality has been validated in that language; the current local drafting patterns remain primarily Chinese/English.

1. Create a complete dictionary matching the English keys in `dist/i18n.js`. Separate modules are preferred for larger translations.
2. Register it in `dist/locales.js` with code, native label, locale, direction and messages. Extend locale matching explicitly for script/region distinctions when required.
3. Preserve placeholders such as `{n}` and the distinction between unknown, reported, uncertain and reviewed. Reviewed does not mean clinically confirmed.
4. Translate the in-app help, episode-review labels, conservative candidate-review controls and fictional examples. A language is not considered shipped if only the top-level menu is translated.
5. Add new modules to service-worker assets and increment the cache version so the language still works after offline caching.
6. Run `npm test`; shipped dictionaries are checked for key and placeholder parity, locale selection, localized demo coverage and key workflow copy.
7. Obtain native-language review of consent, backup, deletion, uncertainty, source labels, candidate wording and summaries. Check long text, narrow screens and enlarged text. RTL languages need full layout review; setting `dir` alone is insufficient.

Never translate or overwrite original personal records when changing interface language. Optional record translation would need separate consent and preserved originals. Machine translation alone is insufficient for medical terminology, consent and privacy copy.

## Current validation level

The six shipped interface languages have automated structural and regression coverage. French, Japanese and Korean were completed together with localized help, fictional demos, episode-review copy, candidate accept/reject controls and offline cache assets.

None of the non-English translations is claimed to have independent professional, native-language or clinical translation validation yet. Translation feedback is welcome. Before a release describes a translation as reviewed, the review itself should be real and documented.

## 中文说明

当前功能分支的界面语言包括：简体中文、英文、西班牙语、法语、日语、韩语。

新增语言不能只翻菜单，还需要同时完成完整字典、帮助页、事件重建文案、候选接受/拒绝文案、虚构示例、离线缓存和自动测试。切换界面语言绝不能覆盖或自动翻译用户自己输入的原始记录。

目前这 6 种语言有自动化结构检查，但**没有宣称法语、日语、韩语等已经经过独立母语人员或临床翻译验证**。本地文本归类规则仍主要面向中文和英文。
