# Care Notes · 照护手记

Review fragmented caregiving accounts without losing the original words, conflicting accounts or unknowns.

[Download APK / 安卓下载](https://github.com/Neil-Moonvale/care-notes/releases/tag/v1.0.4) · [Try web example / 网页示例](https://care-notes-neil.moonenchanter.chatgpt.site/?mode=demo) · [中文](docs/README.zh-CN.md) · [User guide / 使用说明](docs/USER_GUIDE.md) · [Model setup](docs/MOBILE_AI.md) · [Android](docs/ANDROID.md) · [Project status](docs/PROJECT_STATE.md) · [Contributing](CONTRIBUTING.md)

Care Notes is for families whose care recipient cannot reliably keep a diary. Different people remember different pieces; dates can be unclear and an unobserved event is not necessarily an event that did not happen.

**Version 1.0.4** brings a four-screen Android and web workflow: Accounts, AI organize, Results and Settings. The release includes a signed Android APK and source archives. The same interface and evidence core run on both platforms.

Model connections use your own API credit. Automated checks cover transport, consent, output validation, source corrections, restoration and UI controller transitions. Live-provider accuracy and broad real-device compatibility are not certified; review every result before using it for a handoff.

## One workflow

1. **Accounts / 描述:** write or dictate through your phone keyboard, then save the original description.
2. **AI organize / AI 整理:** review the saved text and destination, give consent, then press **Start AI organization / 开始 AI 整理**. A connection test is optional. Progress and errors stay on screen.
3. **Results / 整理结果:** inspect attributed claims, uncertain times, proposed relations and useful clarification questions. Open each claim's original words.
4. Correct an original account. Output depending on that old version is withdrawn. Analyse and review again before exporting a handoff.
5. **Settings / 设置:** configure your model, read the in-app guide, back up or restore your workspace. Previous care records remain accessible here.

The fictional example works without a model or API key. Its annotations are authored; the correction effects are computed locally. This is distinct from model analysis of new text. Original accounts can also be reviewed and exported without AI.

## What the application does

- Preserves immutable source versions, attribution, exact quotations and declared cross-source dependencies.
- Keeps non-observation and uncertainty separate from an asserted absence.
- Proposes event identity, incompatibility, report lineage and order for human review.
- Rejects invalid source references, known temporal incompatibilities and stale responses to edited accounts.
- Supports device-local storage, validated full-history backup/restore, text handoffs, clipboard and printing/PDF.
- Includes Simplified Chinese, English, Spanish, French, Japanese and Korean controls, examples and in-app instructions. Personal text stays in its original language.
- Includes an Android project bundling the same UI and evidence core, with native HTTPS model requests and system file pickers. The app does not need a Care Notes account or a running desktop computer.

These checks do not establish semantic correctness. A model can omit evidence or undeclared dependencies, choose an unsupported subject, or misunderstand a date while producing a structurally valid response. Human review remains necessary. See [the evidence core and its limits](docs/RECONSTRUCTION.md).

## Bring your own model

OpenAI Responses, DeepSeek Chat Completions and a **custom OpenAI-compatible HTTPS endpoint** are supported. Enter a provider API key, fetch its model list and select a text model. Manual model IDs remain available when discovery is unsupported. Protocol compatibility does not establish model quality.

- Custom interfaces offer standard JSON or an explicit compatibility mode that omits JSON format parameters. Both modes validate quotations and output; neither retries automatically.
- On Android, requests go directly to the selected provider.
- On a server-backed web deployment, the two fixed official providers can use the same-origin relay.
- A custom web provider is called directly from the browser and must allow CORS. Custom destinations are never passed through the hosted relay.
- Keys remain in the open page and transient request, outside device storage and backups. No shared maintainer key is provided. Provider charges and policies apply. There are no automatic paid retries.

See [configuration and data flow](docs/MOBILE_AI.md).

## Run and build

Node.js 22 or later:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm start
```

Open the local address printed by the server. The server binds to loopback for local development. `npm run build` produces a Workers-compatible server with embedded public assets. For static hosting, serve `dist/` over HTTP(S); custom/direct model calls require provider CORS support. Offline shell caching requires HTTPS or localhost.

Android requires JDK 17, Gradle 8.9 and Android SDK 35:

```sh
npm run android:prepare
cd android
gradle assembleRelease
```

The CI workflow builds an **unsigned** release artifact. Distribution APKs must be signed by the maintainer; signing keys are never committed. [Android build and installation details](docs/ANDROID.md).

## Validation and scope

The automated suite covers evidence correction, backup validation, both provider formats, custom URL guards, failure behavior and offline asset coverage. CI runs it and builds the Worker. Android CI compiles the native package. These are engineering checks, not live model benchmarks or clinical evidence.

Not implemented: automatic sensor collection, cross-device synchronization, personal clinical baselines, diagnosis, medication recommendations or admission decisions. Further Android device coverage and independent native-language review are still needed.

MIT licensed. Issues describing reproducible problems, translation corrections and independent evaluation cases are welcome.
