# Care Notes 1.0 使用说明 / User guide

[下载 Android APP](https://github.com/Neil-Moonvale/care-notes/releases/tag/v1.0.4) · [打开网页 Demo](https://care-notes-neil.moonenchanter.chatgpt.site/?mode=demo&lang=zh)

## 手机上怎么用

1. 在下载页展开 **Assets**，下载 **Care-Notes-1.0.4.apk**。Android 8.0 及以上；请保持 Android System WebView 更新。已有旧版时直接更新，使用同一签名。升级前在设置导出备份，避免卸载丢记录。
2. 打开后选“体验示例”，再点底部“整理结果”。试着更正日期，看受影响的旧关联撤回。示例为预写的虚构材料，不调用模型，也不收费。
3. 切换“我的整理”，在“描述”里随手写下看到或听到的事情。可以使用手机键盘语音输入。点“保存并去 AI 整理”。
4. 初次使用 AI，在“设置”选择服务商并填写 **API 密钥**，点 **获取模型列表**，再下拉选择文字模型；列表不可用时可以手填模型 ID。自定义服务还需要 HTTPS API 地址及 Chat Completions / Responses 格式。连接测试可选，会使用少量 API 额度；不需要先通过固定照护案例才能开始整理。
5. 在“AI 整理”核对发送的原文和地址，勾选同意后点 **开始 AI 整理**。等待、失败原因均保留在本页；可以停止等待，没有自动付费重试。
6. 成功后自动打开“整理结果”。检查原话、事件时间、关联和待确认问题；每条都有原文入口。模型可能理解错误。
7. 原文有误时先更正，再重新整理。核对后点确认，导出文本、复制或打印为 PDF。完整 JSON 备份保留修改历史，可在设置恢复。

## API 调用失败时

- **密钥被拒绝 / provider_auth**：检查所选服务商与密钥是否对应，密钥是否有效。密钥不要发到 Issue 或聊天里。
- **模型或格式不支持 / provider_model**：检查服务商提供的模型 ID、API 地址与协议。自定义接口若不支持 JSON 参数，可在设置选择“兼容模式（提示词约束）”，然后手动重试。兼容模式同样检查引用和输出结构。
- **网络失败 / provider_network**：APP 检查设备网络和服务商地址。网页版的自定义服务还需要服务商允许 CORS；固定官方服务可通过此 Demo 的转发服务调用。
- **超时 / provider_timeout**：最长等待约两分钟。可减少一次发送的记录再重试；超时不代表服务商一定没有收费。
- **格式或证据检查失败**：结果没有写入，旧结果和原文保留。尝试更少的记录或其他模型；不能把连接测试成功视为理解能力通过认证。

基础记录和示例无需 API。真实 AI 使用服务商的 API 额度，不使用 ChatGPT Plus 对话额度。API 密钥只保留在当前打开的页面，退出或重新加载后需重新填写，不进入备份。网页和 APP 各自保存记录，不自动同步。

六种语言可在右上角切换；示例跟随语言，自己的原文保持原样。旧版记录从设置的“查看原来的照护记录”进入。

## English quick start

Download **Care-Notes-1.0.4.apk** under Assets, or open the web demo. Try the fictional example without an API key. Its analysis is prewritten; correction effects run locally.

In your own workspace, save accounts, configure a provider in Settings, open **AI organize**, review the destination and text, consent, and press **Start AI organization**. A connection test is optional. Success opens Results; errors stay visible and do not overwrite previous output. Custom endpoints support an explicit compatibility mode if JSON format parameters are rejected. All output still passes schema and evidence checks. No request retries automatically.

Correct originals and organize again before reviewing and exporting. Back up before uninstalling or clearing data. Updating the signed APK preserves the app identity; web and Android storage do not sync. Real provider calls need your own API credit. No clinical decisions, medication recommendations or automatic observations are provided.

## 网站、下载和离线使用

`chatgpt.site` 是此演示使用的 OpenAI Sites 托管域名，不是 Care Notes 必须依赖的模型接口。当前演示的大陆直连可达性未验证；更换域名本身不能保证改善访问。

APK 的页面、示例、记录和备份功能内置在安装包中，不需要访问演示网站。AI 请求通过安卓原生 HTTPS 直接连接你配置的服务商。是否能直连，取决于该服务商地址和你的网络。GitHub 下载可能受网络影响；下载可达性与安装后的运行可达性是两回事。网页与 APP 的本地记录不自动同步，请用备份导入。

DeepSeek 官方接口的交互整理采用非思考模式，避免额外思考耗尽有限的输出长度；仍由所选模型提取信息，仍检查原文引用。其他自定义服务不会自动收到 DeepSeek 专用参数。连接测试仅验证短请求，不能替代对当前材料的完整整理。
