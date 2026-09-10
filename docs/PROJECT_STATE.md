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
