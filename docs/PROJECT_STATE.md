# Care Notes 1.1.0 — Evidence Coverage Firewall

Implemented: validated optional coverage profiles, capabilities and reviewed contracts, direct/indirect scope, active/unavailable ranges, cadence and clock handling; deterministic claim audits with bounded negative wording; coverage map, per-claim inspection, heuristic clarification questions and two-account alternate candidates. Source corrections withdraw dependent profiles and output. Coverage edits invalidate saved model narratives. Old backups migrate to unknown coverage; imported derived audits are recomputed.

The final report quarantines unrestricted model prose and renders attributed rule-bounded claims. This is an intentional safety change from 1.0.6, not a claim of universal semantic entailment. A simple coverage form is available in Results. Richer adapter metadata is supported by the validated schema. English/Chinese are complete; new feature copy falls back to English in other languages.

The fictional coverage demo has two caregivers, door-lock records, a removed wearable, camera outage and contradictory accounts. All device sources are simulated. No external sensor integration or new live-model performance evaluation is claimed. No clinical validation, passive collection or medication-adherence verification.

Release validation is recorded in docs/releases/1.1.0.md. Android CI passed; the signed 1.1.0 package matches all 43 bundled source files and retains the 1.0.6 signing certificate. Release publication is tracked by PR #12 and the v1.1.0 release.

---
Previous release state:

# Care Notes 1.0.6

## 2026-09-19: readable reports

The Android and web result page now leads with a plain-language report generated in the same call as structured extraction. Each paragraph links to exact current source quotations. Up to three questions follow. The previous extracted accounts remain available for detailed review. Six-language no-key examples are authored fixtures, explicitly labeled; they are not evidence of live model performance.

Reports are attached to a complete source snapshot and become stale after account additions, edits or deletion. Current reports survive backup/restore and appear in text/PDF exports. Old extraction backups still load but do not masquerade as a newly written report. Saved model prose retains its generation language.

127 automated tests and the Worker runtime check pass. Controlled responses cover both custom Chat Completions and Responses, the hosted path, rendering, provenance rejection, persistence and export. No new live-model narrative-quality evaluation or broad Android hardware acceptance was completed for 1.0.6. Citation validity does not establish semantic correctness.

Version 1.0.5 added GLM-5.3/Flash reasoning budgets and explicit encrypted, endpoint-scoped Android key storage. Web keys remain session-only. See the release notes for those limited live compatibility checks.

## Product boundaries

This is a caregiver information tool, not diagnosis or treatment. No personal clinical baseline, automatic sensing, clinical efficacy, independent model benchmark or cross-device synchronization is claimed. Independent family trials, wider device coverage and native-language review remain open.

---
Historical release notes follow.

# Care Notes 1.0.3

## 2026-09-10: complete output and model aliases

DeepSeek discovery returned `deepseek-flash`, which bypassed the previous version-prefix-specific request profile. A four-source fictional non-health test exhausted all 6000 output tokens in reasoning with both the default and low-effort profiles. Official DeepSeek extraction now uses its documented non-thinking mode across model aliases. Custom endpoints receive no extra vendor parameters. Output-limit responses are distinguished from other incomplete responses; partial output remains rejected and no request is retried automatically. The connection-success label now explicitly describes a basic test, not completed organization.

The current demo is hosted on OpenAI Sites. Mainland-China reachability is not established. The Android UI is bundled, and native model calls do not depend on the demo host. GitHub download reachability and installed-app connectivity are separate concerns.

---
Previous release details:

# Care Notes 1.0.2

## 2026-09-09: provider compatibility repair

The hosted relay failure is reproduced in workerd: `redirect: error` is not supported there and throws before a network request. The Worker adapter now uses manual redirects. Non-2xx responses still fail, and credentials never follow a redirect. A network-free workerd integration check runs the built Worker in CI, including model discovery, a structured connection probe and redirect rejection.

Official DeepSeek V4 calls now explicitly request low reasoning effort while retaining thinking. A default-effort reconstruction returned incomplete output under the bounded token budget; a low-effort run on two fictional, non-health observations returned valid evidence-linked JSON. This is a compatibility smoke test, not a model-quality benchmark. The test credential is not in this repository. Live hosted relay and physical-device acceptance remain separate from local runtime checks.

The regular release integrates the evidence-revision source into main, with one Android download and one canonical public demo. The default-branch README links both prominently. The GitHub Pages entry forwards visitors to the canonical hosted demo, avoiding a second app with different API transport.

## Implemented

Four-screen UI, explicit AI action and result surface, optional protocol connection probe, persistent error state, custom JSON compatibility mode, bounded two-minute requests, source-version validation, correction withdrawal, six languages, local backup/restore, signed Android package and public hosted relay for fixed providers.

## Validation scope

Automated tests and CI exercise synthetic provider success/failure, the actual UI controller, protocol and evidence validation, correction and backup restoration. APK payloads are compared byte-for-byte with source before publication. These checks do not establish live model accuracy or broad phone compatibility. Further device/provider defects need reproducible steps and error codes so they can be verified individually.

## Remaining limitations

Model keys and paid live-provider access are supplied by each user. Independent live-model comparisons, broader device testing and native-language review remain open. No clinical efficacy, automatic sensing, personal clinical baseline or cross-device synchronization is claimed.
