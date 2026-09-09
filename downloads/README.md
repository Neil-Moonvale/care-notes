# Android download / 安卓下载

[Version download page / 版本下载页](https://github.com/Neil-Moonvale/care-notes/releases/tag/v0.4.0-rc.1) · [APK file / 安装包文件](./Care-Notes-0.4.0-rc.1.apk?raw=true) · [Web example / 网页示例](https://care-notes-neil.moonenchanter.chatgpt.site/?mode=demo)

Android 8.0+ with an updated System WebView. This signed release candidate bundles the app offline. It does not require a ChatGPT or GitHub login. Model analysis requires your own provider API key; the fictional example and recording work without one.

安装后先选“体验示例”。自己的记录放在“我的整理”；模型配置和完整使用说明都在“设置”。首次安装时 Android 可能要求允许当前下载来源安装应用。更新或卸载前请先备份。

Build source: `6538a6411b2093b5604f3892ffb273fabda1f793`. Android CI compiled the unsigned release; the distribution copy was signed separately. [Build run](https://github.com/Neil-Moonvale/care-notes/actions/runs/34246751622).

APK SHA-256: `14f2978c0987c190d5b04bae617002a7e5b4c170340c22eb14aa26d5b40a350c`

Signing certificate SHA-256: `42dc36ba5c2506a56df3d9a6791bfae6454f2388962a2765ff64b5ea28170b5a`

The private signing key is not included in the repository or APK. This candidate has passed compilation and signature verification; real-device acceptance, live-model comparison and clinical validation have not been completed. See [the user guide](../docs/USER_GUIDE.md) and [Android details](../docs/ANDROID.md).
