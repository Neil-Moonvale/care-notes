# Model connections

## 中文

在 **设置 → 连接 AI** 中选择服务商，填写 API 密钥和自定义地址（如适用），点 **获取模型列表**，再从下拉列表选择文字模型。无需先填模型名称。接口不支持列表时，保留手动填写模型 ID 的方式。获取列表不发送照护记录，也不进行模型生成。API 密钥不会保存进本机记录或备份，重新打开页面后需再次填写。模型名称、服务商和自定义地址可以记住，不包含密钥。

| 选择 | 如何填写 |
| --- | --- |
| OpenAI | OpenAI 平台的 API 密钥及可用模型 ID，使用 Responses 接口 |
| DeepSeek | DeepSeek 的 API 密钥及可用模型 ID，使用 Chat Completions 接口 |
| 自定义兼容接口 | 服务商给出的 HTTPS API 地址、接口格式、密钥和模型 ID |

自定义地址可以填 `https://服务商域名/v1`，程序按所选格式补上 `/chat/completions` 或 `/responses`；也可以填写完整接口。保留服务商要求的其他路径。不要把聊天网页网址当成 API 地址。当前只支持 HTTPS 标准端口、域名地址和 Bearer 密钥，不支持 HTTP、局域网 IP、任意请求头或所有厂商的独有协议。

**安卓包**从手机直接连接服务商，不需要本站服务器，也不受浏览器跨域限制。**网页版**的自定义接口从浏览器直接连接，需要服务商允许 CORS；失败时可在安卓包中使用同一配置。网页版默认将 OpenAI、DeepSeek 两个固定官方接口经本站转发；如转发不可达，可在“网页连接方式”明确选择浏览器直连，或使用安卓版。程序不会因状态检测失败而自动改变发送路径。

每次发送前都会列出目的地址。可选连接测试只发一个简单的协议检查请求，不发送照护记录；整理只发当前工作区保存的原文、来源称呼和记录时间，不发旧版本、旧记录库或其他设备数据。使用自己的 API 额度，没有维护者共享密钥。失败、停止等待或超时仍可能被服务商计费，没有自动重试。

设置完成后进入 **AI 整理**，查看发送内容与目的地址，确认后点 **开始 AI 整理**。结果在 **整理结果** 页面查看，失败原因会保留在界面上。连接测试是可选步骤，不会阻止直接开始整理。

如果自定义服务商不支持标准 JSON 输出参数，可以明确选择 **兼容模式（仅提示词）**。这会省略相关协议参数，仍要求模型返回规定的 JSON，并执行同样的结构和原文引用校验。程序不会自动换模式或重试。

只通过一次连接测试不代表模型理解可靠；我们没有训练自己的基础模型。不同模型都要经过同一套结构、引用和来源版本检查，但这仍不能证明每个解释正确。

## Technical boundary

The shared implementation is `dist/provider-client.js` and `dist/reconstruction-model.js`; the server and Android/browser entry points use the same schema, prompt and evidence validator. The hosted `/api/mobile/*` relay continues accepting only `openai` and `deepseek`. It rejects custom endpoint fields before any outbound request. Arbitrary destinations are not proxied through the Worker.

Custom browser calls are direct, require CORS and use an explicitly selected HTTPS destination. The Android bridge accepts only bounded model POSTs to HTTPS Responses/Chat Completions paths. Remote web content is blocked from the WebView, which serves only bundled assets on an isolated origin. The native bridge does not follow redirects, uses platform TLS validation and has bounded concurrency/body size/timeouts. A device-side DNS check rejects local/private destinations; this is a personal device client, not an SSRF-resistant public relay.

Keys stay in page and request memory; application code excludes them from storage/exports and does not log model bodies or credentials. This is not a claim of zero retention by infrastructure/providers, hardware-backed key storage, encrypted exports or end-to-end encryption. Users must trust their chosen provider and, for relayed web requests, the deployment operator.

Inputs are capped at 40 current accounts/24000 characters, model output at 6000 tokens and the connection test at 2000 tokens. There is one request per explicit action. The hosted relay has additional best-effort isolate limits, not a spending guarantee. Set budgets in the provider account.

The optional `/api/mobile/connection` probe asks for a simple `{ok:true}` JSON response to check connectivity and protocol handling; it does not evaluate care-information extraction. The older `/api/mobile/check` synthetic non-observation check remains a developer diagnostic, not a prerequisite for using AI. Neither probe is a model benchmark. No live paid model run, independent user study or clinical validation has been completed. Model errors can pass structural checks; all output still requires review.

Model discovery uses an authenticated GET to `/models` (OpenAI: `/v1/models`). Custom API prefixes are preserved. The hosted `/api/mobile/models` route accepts only the two fixed providers, requires explicit action and receives no care records or model ID. Model lists are bounded and held in memory; changing credentials or destinations invalidates pending responses. A listed model is not a guarantee of compatibility or accuracy.
