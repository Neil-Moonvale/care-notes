# Care Notes · 照护手记

**Keep the original words. Review each suggestion. Prepare a clearer visit record.**

[简体中文](docs/README.zh-CN.md) · [Roadmap](docs/ROADMAP.md) · [Translation guide](docs/TRANSLATING.md) · [Security](SECURITY.md)

An early, mobile-first, local-first caregiving journal. Keep separate accounts, uncertainty, corrections and original text when preparing visit summaries. Not a clinically validated product.

## What works in v0.2.0

- Paragraph capture → draft excerpts → explicit confirmation of every draft → save.
- Original paragraphs and exact excerpt positions retained through correction and backup.
- Manual linking and side-by-side review of different accounts, without deciding who is right.
- Selected-record summaries, original references, text download and browser print-to-PDF.
- Separate fictional demos and personal records, offline shell cache, backup/restore and correction history.
- Simplified Chinese and English UI, browser-language detection, a language selector and extensible translation registration. User-entered text is never automatically translated.

## Local rules and AI are separate

| Mode | Behavior | Status |
| --- | --- | --- |
| Local rules | Conservative text segmentation and Chinese/English label suggestions | Available; no model calls or fees |
| AI-assisted classification | OpenAI suggests labels for fixed excerpt IDs; validation rejects omitted, duplicate, fabricated or rewritten items | Adapter and consent UI implemented; no live-model evaluation |
| Clinical reasoning | Diagnosis, treatment decisions, medication advice or crisis assessment | Outside scope |

**The privately hosted static preview has no configured AI backend.** Local features work without one. The optional server enables AI only when its operator configures a model and API key. The frontend never accepts API keys.

Schema and offset checks establish internal consistency, not truth, authorship, cryptographic integrity or medical accuracy. Labels can be wrong. Dates stay blank until a person supplies them; related accounts remain manually linked.

## Run without dependencies

The authored `dist/` files are the app source. No build step is required.

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Choose **Try the demo → Capture a paragraph → Use a fictional example → Organize locally**. Review every draft and save. Open a saved note to see **Original evidence**, then prepare a summary.

ES modules need HTTP, not file opening. Service workers require HTTPS or localhost and browser support.

## Optional personal AI server

Requires Node.js 22 or later. `npm start` serves the app at `http://127.0.0.1:8787`; without configuration AI stays disabled.

Copy `.env.example` to `.env`, supply your own `OPENAI_API_KEY` and explicitly chosen `OPENAI_MODEL`, then run:

```sh
node --env-file=.env server/index.mjs
```

The server binds to loopback only. It checks host, request origin, consent, input size and request frequency. Only the current consented paragraph is sent to OpenAI; no saved-record sync occurs. Requests use Structured Outputs and `store: false`, with no automatic paid retries. This is not a guarantee of zero data retention by providers or hosts.

Do not expose this personal server through public tunnels. Hosted multi-user AI still needs authenticated access, per-user quotas, operational checks and approved costs. The static Sites preview does not run `server/`. See [AI architecture](docs/AI.md).

## Reuse and verification

- `dist/core.js`: validated backups, explicit linking, corrections and deterministic summaries.
- `dist/provenance.js`: original paragraph, quote and offset consistency.
- `dist/draft.js`: segmentation, classification validation and confirmation gates.
- `server/ai.js`: provider adapter and request guards, independent of UI.
- `examples/fictional-inputs.json`: illustrative inputs, not a clinical benchmark.

Run `npm test`. **27 automated checks pass** across data, evidence, localization and mocked provider behavior. No real-model, clinical or mobile end-to-end accuracy is claimed. [Validation notes](docs/VALIDATION.md).

## Data ownership

Records, full capture paragraphs and histories live unencrypted in this browser's localStorage. Anyone with access to the browser profile may access them, including offline. Clearing the browser or storage eviction can erase them. Back up before changing device, browser or origin.

Local organization sends no records. A separately configured, explicitly consented AI request sends only its input. Hosting providers may handle ordinary request metadata and access control. No analytics or background sync is implemented.

Backups contain complete capture paragraphs, potentially including text outside selected excerpts. Summaries omit recorder names by default, but free text can identify people. Review before sharing. Import replaces personal records after confirmation. New exports use backup version 2; versions 1 and 2 can be imported. Older app releases may reject version 2 rather than silently dropping new evidence fields.

## Maintenance

Maintainer: [Neil-Moonvale](https://github.com/Neil-Moonvale). [Source repository](https://github.com/Neil-Moonvale/care-notes).

Use fictional examples in feedback. See [CONTRIBUTING.md](CONTRIBUTING.md). This is an early project, not a claim of global novelty, broad adoption or proven health benefit. No OpenAI support-program application has been submitted. [Application preparation](docs/OPEN_SOURCE_APPLICATION.md).

MIT · Copyright © 2026 Neil-Moonvale. See [LICENSE](LICENSE).
