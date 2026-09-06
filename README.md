# 照护手记 / Care Notes

一个手机优先、设备本地保存的照护记录工具。将本人自述、家属观察与医嘱转录整理成保留来源、分歧和不确定性的复诊摘要。

A mobile-first, device-local care journal. Prepare visit summaries that preserve original words, source types, uncertainty, and differences between accounts.

## v0.1.0

- 独立的虚构示例与个人记录空间 / Separate fictional demo and personal records.
- 日期、近似时间、来源、确定性、原话与记录者称呼 / Dates, approximate times, source and uncertainty labels.
- 手动关联同一事件，不自动判断矛盾或对错 / Explicit event linking without deciding who is right.
- 核对说明与更正前版本保留 / Review notes and correction history.
- 选择、筛选、文本导出与浏览器打印 PDF / Selective summaries, text export and print-to-PDF.
- JSON 备份恢复、输入验证、删除 / Validated JSON backup, restore and deletion.
- 中英文界面、离线页面缓存 / Chinese and English UI, offline shell cache.

## Run locally

No build step or runtime dependencies. Serve the authored `dist/` directory over HTTP:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. ES modules require an HTTP server; opening index.html as a file is not supported. Service workers need HTTPS or localhost.

Tests require a modern Node.js runtime:

```sh
npm test
```

## Reusable core

`dist/core.js` exports backup validation, explicit linking, grouped review state, date filtering, and deterministic summary generation. It can be imported without the UI. Tests in `tests/core.test.mjs` use fictional records.

The summary quotes user-entered text. It does not use a language model, infer clinical conditions, identify contradictions automatically, or create treatment recommendations. Source references improve traceability; they do not prove medical accuracy.

## Data and privacy

Records and previous versions live in localStorage in the current browser on this device. There is no backend record upload, analytics, cross-device sync, or account system in the app. The hosting provider may handle ordinary web request metadata and access control. No third-party fonts or external app scripts are loaded.

Local storage is not encryption. Browser clearing, private browsing or storage eviction can lose records. Back up before changing browser, device or origin. Backups contain sensitive plain-text data, including correction history; protect them and share selectively. Shared text summaries omit recorder names by default but free-text descriptions can still include personal information. Review the content before sharing.

Import replaces My records only after confirmation. Corrupt persisted data is not silently overwritten. JSON input is size-limited and validated; unsupported versions are rejected. Editing or adding to a linked event reopens its review. The UI does not label a person truthful or untruthful.

The service worker caches app files for offline use. Anyone with access to this browser profile may be able to open local records, including offline. First load, hosting access checks, installation and cache availability depend on the browser.

## Limitations

Early functional prototype, not a clinically validated product. No diagnosis, medication advice, crisis assessment, passive monitoring, voice transcription, automatic translation of medical text, or cloud sharing. No claim of global novelty or proven health benefit. AI extraction may be considered later only as optional, reviewable assistance.

Automated tests cover core data behavior. Mobile visual and end-to-end browser testing has not yet been performed. Please begin with fictional examples and report browser/device-specific issues.

## Project status

Maintainer: [Neil-Moonvale](https://github.com/Neil-Moonvale). Source repository: [Neil-Moonvale/care-notes](https://github.com/Neil-Moonvale/care-notes). The first preview is hosted privately for the owner. This project is not affiliated with or endorsed by OpenAI; no support-program application has been submitted.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Use fictional examples in issues, tests, screenshots and demonstrations. Do not submit medical records or identifying information about another person.

## License

MIT. See [LICENSE](LICENSE).
