# Care Notes 1.0.1

The regular release integrates the evidence-revision source into main, with one Android download and one canonical public demo. The default-branch README links both prominently. The GitHub Pages entry forwards visitors to the canonical hosted demo, avoiding a second app with different API transport.

## Implemented

Four-screen UI, explicit AI action and result surface, optional protocol connection probe, persistent error state, custom JSON compatibility mode, bounded two-minute requests, source-version validation, correction withdrawal, six languages, local backup/restore, signed Android package and public hosted relay for fixed providers.

## Validation scope

Automated tests and CI exercise synthetic provider success/failure, the actual UI controller, protocol and evidence validation, correction and backup restoration. APK payloads are compared byte-for-byte with source before publication. These checks do not establish live model accuracy or broad phone compatibility. Further device/provider defects need reproducible steps and error codes so they can be verified individually.

## Remaining limitations

Model keys and paid live-provider access are supplied by each user. Independent live-model comparisons, broader device testing and native-language review remain open. No clinical efficacy, automatic sensing, personal clinical baseline or cross-device synchronization is claimed.
