# Care Notes · 照护手记

Review care accounts, keep their sources, and prepare a clearer handoff.

[使用指南 / User guide / Guía de uso](docs/USER_GUIDE.md) · [中文介绍](docs/README.zh-CN.md) · [Roadmap](docs/ROADMAP.md) · [Contributing](CONTRIBUTING.md)

Care Notes is a mobile-friendly web application for families organizing care observations. It preserves different accounts and uncertainty, with references back to the original records. No additional hardware is required.

## Use it

1. Try the fictional examples, or write an account in **My records**.
2. Select the records for an episode and review what needs clarification.
3. Download a handoff or visit summary, with source references.

Open **How to use** in the application for step-by-step instructions. The interface, help and built-in examples are available in Simplified Chinese, English and Spanish. Personal records keep their original language.

## Features

- Paragraph drafts with confirmation before saving.
- Explicit event linking and side-by-side accounts.
- Missing-information checks and warnings about excluded linked records.
- Original excerpts, correction history, selected summaries and text export.
- Device-local storage, offline page cache and backup/restore.

Current version: **0.3.1**. The hosted trial uses local rules; online AI is not enabled. The optional server-side classification adapter requires separate configuration. No automatic diagnosis, treatment advice or clinical validation is claimed. [Project status](docs/PROJECT_STATE.md).

## Run locally

The authored `dist/` directory is the application source; no build or dependency installation is needed.

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Modules require HTTP; opening the HTML file directly is not supported. Offline caching requires HTTPS or localhost and browser support.

For the optional personal AI server, see [AI setup](docs/AI.md). Do not expose the localhost server through a public tunnel.

## Data

Records are stored unencrypted in the current browser, without cross-device sync. Export a backup before clearing browser data or changing devices. Backups include original paragraphs and corrections; check files before sharing. [Security and privacy](SECURITY.md).

The private hosted trial can require platform sign-in. This is separate from the application's local record storage. A phone browser can use the trial without a desktop connection.

## Development

Run `npm test` with Node.js 22 or later. [Validation notes](docs/VALIDATION.md) distinguish local regression checks from live-model and browser testing.

Reusable modules include evidence validation, paragraph drafts and episode assembly. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [translation guide](docs/TRANSLATING.md).

Maintained by [Neil-Moonvale](https://github.com/Neil-Moonvale). MIT license; see [LICENSE](LICENSE).
