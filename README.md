# Care Notes · 照护手记

**Reconstruct what happened when nobody could reliably document it.**

[▶ Try the live demo / 在线体验](https://neil-moonvale.github.io/care-notes/) · [使用指南 / User guide / Guía de uso](docs/USER_GUIDE.md) · [中文介绍](docs/README.zh-CN.md) · [Project status](docs/PROJECT_STATE.md) · [Roadmap](docs/ROADMAP.md) · [Contributing](CONTRIBUTING.md)

Care Notes is an early open-source, phone-first caregiving project for turning fragmented, incomplete and sometimes conflicting accounts into a reviewable episode and a clearer handoff.

The core workflow must be useful with **one Android phone and one caregiver**. No wearable, smart home, camera, pillbox sensor or other extra hardware is required. Optional evidence sources may improve a future reconstruction, but they must never be prerequisites.

## Evidence revision and model connection

The development branch includes a [source-version and event-relation core](docs/RECONSTRUCTION.md) and a [phone-accessible model connection flow](docs/MOBILE_AI.md). In a server-backed deployment, open **Organize with AI**, configure your own provider and model, test with one fictional account, then submit the current saved accounts with explicit consent. OpenAI and DeepSeek adapters share local schema and evidence validation. Keys stay in the open page and request handler, outside browser storage and backups.

**Try the example** remains an offline, authored six-language correction demonstration. Correcting an account withdraws dependent old output and keeps the original versions. Personal workspaces now survive reloads and have validated backup restore and a review-before-export step.

The public GitHub Pages link above remains a static demo; it does not run the model server. The new flow is on this development branch and in its server-backed preview. Provider tests use simulated responses. Live-model results, phone acceptance and independent user evaluation are pending; the connection test is not a quality certification.

## The problem it is trying to solve

The hardest periods are often the ones nobody documents well. The cared-for person may be unable or unwilling to keep a diary, caregivers may remember different pieces, dates may be uncertain, and “no record” may simply mean nobody knows.

Care Notes is therefore not trying to win as another note-taking or statistics app. Its signature workflow is **Episode Reconstruction**:

1. capture the fragments that actually exist;
2. keep the original wording, source and uncertainty;
3. select the material that may belong to one period of change;
4. surface missing information and conflicting/linked accounts;
5. propose only conservative review candidates when two unlinked records share a category and are close in time;
6. require a person to accept or reject every such candidate — never merge silently;
7. export a handoff in which the source records remain traceable.

A dismissed candidate stays a local review choice and is not written into the handoff as evidence. A confirmed link keeps both original records separately reviewable.

## What works now

The current development line includes:

- paragraph capture with confirmation before saving;
- original excerpts, provenance, correction history and backup/restore;
- an episode workspace for choosing the records that belong in a handoff;
- manually linked accounts with incomplete-group warnings;
- explicit checks for unknown dates, unknown sources and uncertain statements;
- conservative **same-change-period candidates** with explicit **Link / Not the same period** controls;
- a fully fictional phone-only multi-day evaluation fixture;
- selected summaries and text handoff export;
- Simplified Chinese, English, Spanish, French, Japanese and Korean interface/help/examples;
- device-local browser storage and offline shell caching.

The six interface translations are covered by dictionary, placeholder, demo and workflow regression checks. They have **not** received independent native-language or clinical translation validation; translation feedback is welcome. The current local drafting patterns remain primarily Chinese/English, so interface availability must not be confused with validated semantic classification in every language.

The current hosted/static workflow uses local deterministic rules. It does **not** claim AI event understanding, diagnosis, treatment advice, medication adjustment, hospital-admission decisions or clinical validation.

## Why the candidate system is deliberately conservative

Two records being close in time is not proof they describe the same event. The current rule only surfaces a candidate when unlinked records share a category and are sufficiently close in known time. It does not infer meaning from free text and never creates a link automatically.

Examples of unsupported upgrades that Care Notes must not make:

| Fragment | Care Notes must not silently conclude |
| --- | --- |
| “I did not see them sleeping” | “They had insomnia” |
| “I did not see the medication taken” | “The dose was missed” |
| no meal record | “They did not eat” |
| two different accounts | “One person is wrong” |
| no record for a day | “Nothing happened” |

## Use it

1. Try the fictional examples, or write an account in **My records**.
2. Open **Review an episode / 整理经过**.
3. Select the records that belong in this handoff.
4. Review missing-information questions and any “may belong to the same change period” candidates.
5. Accept a candidate only after checking both source records, or dismiss it.
6. Download the episode handoff or prepare a visit summary.

Open **How to use** in the application for step-by-step instructions. Personal records keep their original language and are not automatically translated when the interface language changes.

## Run locally

The authored `dist/` directory is the application source; no build or dependency installation is needed.

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Modules require HTTP; opening the HTML file directly is not supported. Offline caching requires HTTPS or localhost and browser support.

For the optional personal AI classification server, see [AI setup](docs/AI.md). It is separate from the episode-reconstruction rules and is not required for the fictional demo.

## Data and privacy

Records are stored unencrypted in the current browser, without cross-device sync. Export a backup before clearing browser data or changing devices. Backups include original paragraphs and corrections; check files before sharing. [Security and privacy](SECURITY.md).

The current priority is a reusable evidence-revision core and a phone-usable web workflow. Native Android packaging, additional languages and device integrations are paused while the core is evaluated.

## Development

Run `npm test` with Node.js 22 or later. [Validation notes](docs/VALIDATION.md) distinguish regression checks from live-model, clinical and real-device validation.

The repository intentionally uses feature branches, automated checks and review gates. Real bugs, fixes, releases and outside feedback should remain visible as normal open-source maintenance history.

Maintained by [Neil-Moonvale](https://github.com/Neil-Moonvale). MIT license; see [LICENSE](LICENSE).

