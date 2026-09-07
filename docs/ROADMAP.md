# Roadmap / 开发路线

## Current product direction

Care Notes is evolving from a careful caregiving journal into an **evidence-first, caregiver-first episode reconstruction system** for periods when the person being cared for cannot or does not reliably document their own experience.

The signature v0.3 experience is **“What happened? / 发生了什么？”**: heterogeneous evidence is normalized, compared with a personal baseline, grouped into reviewable change clusters and kept traceable back to source evidence. See [Product Vision](PRODUCT_VISION.md) and [Evidence Schema](EVIDENCE_SCHEMA.md).

## Implemented in v0.2

- [x] Local recording, fictional demos, manual linking, review and export.
- [x] Paragraph drafts with exact source evidence and mandatory confirmation.
- [x] Unknown-source support, conservative uncertainty and dates awaiting review.
- [x] Chinese/English UI, locale selection and translation contribution path.
- [x] Optional server-side AI adapter with mocked contract checks.
- [x] Public source, MIT license, automated checks and contribution documentation.

## v0.3 — Zero-input Episode Reconstruction

Already implemented on the v0.3 feature branch:

- [x] Product vision for caregiver-first, evidence-first reconstruction.
- [x] Canonical Care Evidence Schema and graph relations.
- [x] Deterministic evidence validation with stable evidence IDs.
- [x] Robust personal-baseline calculation using medians and median absolute deviation.
- [x] Baseline-deviation detection without diagnostic labels.
- [x] Explicit conflict preservation for contradictory observations.
- [x] Explicit unknown-state handling when a source is unavailable.
- [x] Deterministic episode clustering with evidence-linked derived claims.
- [x] Fully fictional seven-day household evidence stream.
- [x] Bilingual “What happened?” browser demo with click-through source evidence.
- [x] Automated tests for evidence validation, baseline changes, conflicts, unknowns and unsupported claims.

Release gates before merging v0.3 to `main`:

- [ ] Run the complete automated test suite in CI and resolve any regressions.
- [ ] Test the new episode demo on the owner's Android phone.
- [ ] Review mobile layout, accessibility, keyboard navigation and browser compatibility.
- [ ] Add an obvious README entry point and screenshots for the v0.3 demo.
- [ ] Add source-availability/gap records so `no event` cannot be confused with `sensor unavailable`.
- [ ] Add a first adapter interface for Health Connect / Home Assistant / Frigate-shaped events without requiring real hardware.
- [ ] Document the threat/privacy model for passive evidence and camera metadata.

## After v0.3

- Android-first client for Health Connect, background permissions, notifications and quick caregiver capture.
- Home Assistant event adapter.
- Frigate review/event metadata adapter; raw continuous video remains local by default.
- Provider-independent AI/BYOK layer (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, OpenAI-compatible endpoints and local models such as Ollama where practical).
- Evidence-bound model evaluation: source confusion, omissions, fabricated evidence IDs, semantic upgrades, uncertainty loss and conflicting accounts.
- Visit-preparation views with short, medium and full evidence-linked summaries.
- Optional encrypted family sharing only after the local evidence model is stable.

## Open-source maintenance and support application

Use actual implementation, maintenance and adoption evidence. Never manufacture stars, issues, releases, users, endorsements or clinical outcomes. Real bug reports, review discussions, fixes, pull requests and releases should remain visible as normal project history.

The OpenAI open-source support application is a project goal, but release decisions should still be driven by a useful, defensible product. Do not submit until the repository clearly demonstrates the distinctive episode-reconstruction workflow and has credible maintenance evidence.

中文：v0.3 的重点不是继续堆普通记录功能，而是把“患者无法主动记录时，如何通过多来源证据重建发生了什么”真正做成可运行、可追溯、可测试的核心能力。
