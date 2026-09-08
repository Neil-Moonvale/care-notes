# Project status

Updated 2026-09-08 · **0.4.0-rc.1**

## Current development build

The complete-workflow candidate is on `feature/evidence-revision-core` (PR #4, stacked on PR #3). It has one front door with Accounts, Review and Settings. The old records app remains at `records.html`; its data is preserved.

Implemented:

- Original accounts, attributed claims, immutable source versions, declared dependencies and correction-triggered withdrawal.
- Shared model extraction and evidence validation for the hosted server, direct browser clients and Android.
- OpenAI, DeepSeek and custom OpenAI-compatible Chat Completions/Responses endpoints.
- Six-language UI, examples and in-app instructions.
- Local workspace, validated backup/restore, source removal, handoff text, clipboard and print/PDF controls.
- Android source with bundled assets, direct HTTPS requests and system document pickers.
- Automated core/provider checks, Worker build and Android build workflow.

A custom browser provider must allow CORS. The native Android client avoids that browser restriction. Hosted relay destinations remain fixed to the two official providers. No key is shared or saved in browser records/backups.

## Publication

The owner-private hosted site is the current evaluation surface. The default branch and older public Pages demo have not been promoted to this candidate. Keep the existing mobile acceptance gate on PR #3; building an APK is not that acceptance.

Android CI compiled the unsigned artifact. A separately signed distribution APK is available in `downloads/`, with SHA-256 and signing-certificate fingerprints. APK v2/v3 signature verification passed. The unsigned CI artifact must not be presented as the installable download.

## Still unverified

- Real phone launch and full capture/review/export/restore/Back/PDF walkthrough.
- Paid live-model outcomes and a fair same-model baseline comparison.
- Independent held-out cases, caregiver usefulness and native-speaker translation quality.
- Clinical outcomes or safety of clinical decision-making; this app does not make those decisions.

## Scope still absent

Automatic sensor imports, zero-input monitoring, cross-device sync, personal clinical baselines and diagnosis/treatment/admission recommendations are not implemented. They are not implied by the current release candidate.

Next priority: acceptance and measured usefulness of this complete workflow, followed by fixes supported by that feedback. See [User guide](USER_GUIDE.md), [Model setup](MOBILE_AI.md) and [Android](ANDROID.md).
