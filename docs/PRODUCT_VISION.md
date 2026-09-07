# Care Notes Product Vision

## One-sentence purpose

**Care Notes reconstructs what happened during periods when the person being cared for cannot or does not reliably document their own experience.**

The project is caregiver-first, evidence-first and local-first. It is not an AI therapist, diagnosis engine or generic mood tracker.

## The problem

The moments that matter most are often the moments nobody can document well.

In severe or recurring mental, cognitive or behavioral instability, self-report can become incomplete, delayed, inconsistent or impossible. Family caregivers may only have fragments: a short note, a door event, unusual night movement, a wearable sleep change, a phone activity window, or conflicting recollections from different people.

Traditional journals expect somebody to actively record. Monitoring tools often stop at charts or alerts. Care Notes aims to reconstruct a reviewable episode from those fragments while preserving uncertainty and provenance.

## Core concept: Zero-input Episode Reconstruction

“Zero-input” does **not** mean invisible surveillance or literally zero human involvement. It means the workflow must not depend on the cared-for person actively filling out a journal during the episode.

Potential evidence sources include:

- caregiver notes and voice capture;
- Android Health Connect data such as sleep, activity and heart rate;
- Home Assistant events such as motion, doors and room activity;
- Frigate camera metadata such as object/review events, without requiring continuous cloud video upload;
- medication-related evidence that distinguishes reminders, container access and human confirmation;
- other explicit, consented device adapters.

## Signature experience: “What happened?”

Instead of leading with a chatbot or dashboard full of charts, the main review experience should answer:

> **What happened during this period, what evidence supports it, and what is still unknown?**

A reconstructed episode should include:

1. a chronology;
2. deviations from the person's own baseline;
3. source-linked evidence;
4. conflicts between accounts;
5. missing or unknown information;
6. explicit human confirmation before important derived records are accepted.

## Care Evidence Graph

Every observation becomes an evidence node with stable identity, source, time and provenance. Relations between evidence may include:

- `supports`
- `conflicts_with`
- `same_episode`
- `baseline_deviation`
- `derived_from`
- `uncertain_about`

The graph is a traceability structure, not proof of medical truth.

## Evidence-bound AI

AI may propose labels, relationships, summaries and episode groupings. It may not silently rewrite evidence or upgrade weak signals into facts.

Examples:

- `phone active at 03:31` must not become `insomnia` without sufficient supporting evidence and human review;
- `pillbox was not opened` must not become `medication was not taken`;
- conflicting caregiver accounts must remain visible as a conflict instead of being resolved by the model.

Every AI assertion that enters a reconstructed episode should reference concrete evidence IDs. Deterministic validation should reject unsupported, fabricated, duplicated or semantically stronger claims where possible.

## Personal baseline, not population labels

Care Notes should compare current patterns to the same person's recent baseline rather than treating generic population norms as diagnoses.

Early implementations should favor transparent robust statistics and clearly expose missing data. Predictive clinical claims are outside the core promise.

## Privacy and consent

- Local-first by default.
- No covert surveillance features.
- Passive sources must be visible and explicitly configured.
- Raw continuous camera video should stay local by default.
- Frigate/Home Assistant style event metadata is preferred for routine ingestion.
- Cloud model submission, when supported, must be explicit and scoped.
- Bystander privacy and local law remain deployment responsibilities.

## AI provider strategy

The architecture should be provider-independent and compatible with BYOK/self-hosting. The open-source maintainer is not expected to pay API costs for every user.

Target adapters may include OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, OpenAI-compatible endpoints and local models such as Ollama.

## Product surfaces

### Web / PWA

The web app remains the fastest public demo, review surface and contributor entry point. It should make the core idea understandable without installing an APK.

### Android

Android is the primary long-term client because Health Connect, background permissions, notifications and device integration are central to the real use case.

### Core engine

Evidence schema, baseline logic, reconstruction, validation and provider adapters should remain reusable outside a single UI.

## v0.3 goal

Build a fully fictional, no-paid-API demonstration of a seven-day household evidence stream that can be reconstructed into reviewable episodes.

The demo should prove these behaviors before adding real-device integrations:

- normalized evidence events;
- personal baseline comparison;
- episode clustering/reconstruction;
- source-linked timeline;
- explicit unknowns and conflicts;
- deterministic safeguards against unsupported claims.

## What Care Notes is not

- not a clinical diagnosis tool;
- not a treatment or medication decision system;
- not a suicide/crisis prediction product;
- not a generic AI chat interface;
- not a replacement for clinicians or emergency services;
- not a claim that passive sensing, evidence graphs or digital phenotyping are individually novel.

The project's distinct value is the integrated, caregiver-first workflow for reconstructing poorly documented episodes from heterogeneous evidence while keeping every conclusion traceable and uncertainty first-class.
