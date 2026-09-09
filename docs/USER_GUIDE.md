# 使用说明 / User guide

本页对应 **0.4.0-rc.1**。[安卓下载](https://github.com/Neil-Moonvale/care-notes/releases/tag/v0.4.0-rc.1) · [网页示例](https://neil-moonvale.github.io/care-notes/?mode=demo&lang=zh)。

## 中文

### 第一次打开

应用只有三个主入口：**描述、核对、设置**。先点 **体验示例**。这是完全虚构的案例，不需要 API，也不会混入自己的记录。在“核对”里更正案例中的日期，可以看到哪些旧描述和关系退出了当前结果。

### 记录自己的情况

1. 切回 **我的整理 → 描述**。
2. 写下看到、听到或不确定的事情；可以使用手机键盘的语音输入。不需要猜测时间或强行填完整资料。
3. 来源称呼可以填“妈妈”“本人”等，也可以留空。点 **保存描述**。
4. 按同样方式补充其他人的说法。保存、核对原文和导出不需要 AI。

### 使用模型整理

到 **设置 → 连接 AI**，选择服务商，填写模型名称和 API 密钥。自定义服务还要填 API 地址和接口格式。模型账户需要可用额度；ChatGPT 聊天订阅与此处的服务商 API 是不同的使用入口。

先勾选授权，发送一条虚构描述测试连接。成功只说明这个基本例子通过，不证明所有分析都正确。回到“描述”，查看发送地址并同意发送当前材料，再点 **整理这些描述**。请求没有自动重试；中断或超时仍可能产生费用。

### 核对和更正

在 **核对** 里阅读原话、来源、时间范围和关系。关系是待核对的提议。“没看到吃药”应保留为不知道是否服药，不能解释成漏服。引用能打开原始描述及历史。

某人说错日期或补充了情况时，修改对应原文并保存更正。依赖旧版原文的结果会退出当前分析；点整理重新分析。未分析的材料会明确标记。不要把没有触发问题理解成资料已经完整。

### 导出和备份

核对当前结果后，点 **我已核对当前结果**，即可导出交接文本、复制或打印/保存 PDF。这是你对当前内容的确认，不是临床认证。

**交接文本不是完整备份。** 到设置下载完整 JSON 备份才能保留原文版本和分析历史。恢复备份会替换“我的整理”，需要确认。删除单条描述会撤回相关当前结果，但历史仍在备份中；彻底清除请使用设置中的清空功能。

网页版与安卓包各自保存在本机，不自动同步。换设备时导出完整备份，再在另一端恢复。卸载 APP 或清除应用/浏览器数据前要备份。

### 原来的记录在哪里

设置中有 **查看原来的照护记录**。原来保存的记录和备份格式保持不变，不会自动混入新的整理工作区。旧记录的功能仍可单独使用。

### 安卓安装

使用维护者提供的签名 APK。手机首次安装时，系统可能要求允许当前下载来源安装应用。只开启本次使用的来源；安装后可关闭。不需要 GitHub、ChatGPT 或电脑登录。Android 8.0 以上，并保持 Android System WebView/Chrome 更新。详细说明见 [Android](ANDROID.md)。

## English

Use **Accounts → Review → Settings**. Try the fictional correction example first; it needs no model and stays separate from your workspace. Save original accounts in your own words. Use your keyboard's dictation if useful; the app has no independent speech recognition service.

Configure a provider, model ID and your API key in Settings. Custom providers also require an HTTPS base URL/full endpoint and protocol selection. Test one fictional account with explicit consent, then consent to sending your current saved accounts for analysis. A passing connection test is not an accuracy certification.

Review claims, source quotations, uncertain times and proposed relations. Correct a source when the account changes. Dependent old output is withdrawn; analyse and review again. Unanalysed material remains explicitly marked.

After marking the current result reviewed, export text, copy a handoff or print/save PDF. Use the separate full JSON backup to preserve revision history. Restoring replaces the workspace after confirmation. Previous care records are retained under Settings and use their original storage/backup format.

Android and web copies do not sync automatically. Back up before uninstalling, clearing data or changing devices. The APK bundles the interface and uses the system file picker; basic recording and the fictional example work offline. Model analysis needs network access and your provider's credit.

French, Spanish, Japanese and Korean step-by-step instructions are available inside **Settings** in the selected interface language. User text is not automatically translated. All model interpretations still need human review.
