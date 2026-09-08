# Model connection on a phone

## 中文：从这里开始

在带服务端的版本中，打开 **整理经过 → 智能整理**。进入“我的整理”，它与原来的普通照护记录分开保存。

1. 打开 **连接 AI**，选择 OpenAI 或 DeepSeek，填写你自己的模型名称和 API 密钥。服务商账户需要有可用 API 额度；本项目不提供共享密钥。
2. 勾选测试授权，点 **测试连接（会使用少量额度）**。只发送一条固定的虚构描述，检查接口格式以及“没看到服药仍然是未知”。通过一个例子不代表所有材料都能处理正确。
3. 在 **补充一段描述** 输入原话并保存。来源称呼可留空；不清楚的日期不用猜。可以使用手机键盘自带的语音输入，本项目尚未实现独立语音识别。
4. 核对页面列出的发送对象，勾选发送授权，再点 **整理这些描述**。只发送本页保存的当前原文、来源称呼和记录时间，不发送旧版本或其他记录库。
5. 查看整理结果、引用、未知和待确认问题。日期或说法有误时，修改对应原文，保存更正，再次分析。旧版本和撤回情况可以查看。
6. 核对当前结果后标记 **我已核对当前结果**，导出交接文本。标记仅表示你的确认，不是临床认证。完整历史用 **下载完整备份** 保存；**恢复备份** 会在确认后替换“我的整理”。

**体验示例**保留了六种语言的虚构更正演示，无须模型或密钥。示例修改不混入“我的整理”。切换语言不会翻译或替换你写的原话。个人工作区保存在当前浏览器，清除浏览器数据或更换设备前要备份。密钥仅在当前页面内存中，刷新或断开后需要重新填写。

接口连通、结构检查和引用检查都不能证明分析正确。现在尚未完成真实模型对比、手机操作验收、母语者审校或实际家属使用研究。没有 Android APK 发布。

## English: deployment and trust boundary

The hosted Worker serves the existing app and `/api/mobile/status`, `/api/mobile/check` and `/api/mobile/reconstruct` from one origin. The browser submits a user-entered API key only after explicit consent. There is no maintainer-funded shared model account. The key is kept in page memory, cleared on disconnect/page exit, and excluded from local storage and exports. The server handles it transiently without application-level logging or persistence. **Trust in the site operator, hosting infrastructure and selected provider is still required.** This is not end-to-end encryption, a no-retention guarantee or an encrypted browser vault. Provider policies apply.

Only the fixed official HTTPS endpoints for OpenAI Responses and DeepSeek Chat Completions are supported. Arbitrary proxy URLs, redirects and user-supplied headers are rejected. JSON-schema requests use OpenAI's [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs); DeepSeek's [JSON Output](https://api-docs.deepseek.com/guides/json_mode/) is checked against the same schema locally. Compatible protocol support is not a claim that every model is suitable. The user supplies an explicit model ID; no model or paid request is selected automatically.

Requests are same-origin JSON with a dedicated header and explicit consent. Input is bounded to 40 current accounts / 24000 characters, request bodies to 128 KB, provider responses to 500 KB, and output to 2000 tokens for a connection check / 6000 for reconstruction. Timeout is 60 seconds. There are no automatic paid retries or fallback models. A failed or interrupted request may still be charged by the provider. The Worker allows two concurrent calls and ten model calls per minute **per isolate**; these are best-effort limits, not global spending controls. Set provider-side budgets. Preserve authenticated/private access for personal use; do not turn this into a public shared-key service.

The single fictional connection check is a format and basic non-observation smoke test. It sends no saved care material. It is not a quality certification, benchmark or clinical validation. Every actual result must still pass local schema/quotation checks and human review. Source edits invalidate dependent claims; replies to old snapshots are discarded. Missing or invalid output is not replaced with invented annotations.

## Run and build

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm start
```

The Node server binds only to loopback for local development. For a phone, deploy the Worker to an authenticated HTTPS hosting environment; the build is:

```sh
npm run build
```

`dist/server/index.js` is a self-contained Workers-compatible ESM entry with embedded public assets. The source `dist/` files remain usable for static hosting and GitHub Pages, where the AI service is unavailable. Local source and hosted output share `server/mobile-api.js` and the same reconstruction core. Sites uses its private, deployment-specific `.openai/hosting.json`; a plain checkout can build without that file. Do not commit secrets or personal workspace exports.

Full workspace JSON restores source history and validates derived analyses instead of trusting exported result fields. It is a separate format from the original note backups. It contains personal text and should be handled accordingly. Keep third-party scripts out of the page. Further storage hardening, independently reviewed privacy controls, live-model evaluation and phone acceptance remain release work.
