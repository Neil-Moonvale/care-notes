# Android app

[Download the signed 1.0.0 APK](../downloads/README.md).

The `android/` project packages the current six-language interface and evidence core. Its interface and evidence core are bundled for local use. No Care Notes/ChatGPT login or desktop computer is needed to use the installed app.

- Android 8.0 or newer, with an up-to-date Android System WebView/Chrome.
- Bundled offline recording, fictional example, corrections and local history.
- Native HTTPS requests to the configured provider; API keys remain transient.
- System document pickers for backup save/restore, clipboard and Android printing/PDF.
- Only Internet permission. No camera, microphone, contacts or broad storage permission.
- App backup/cloud transfer is disabled in the manifest. Use explicit JSON exports when moving devices.

## Build

Requires JDK 17, Gradle 8.9, Android SDK platform 35 and build tools 35.0.0.

```sh
node scripts/prepare-android.mjs
cd android
gradle --no-daemon assembleRelease
```

`app/build/outputs/apk/release/app-release-unsigned.apk` is **unsigned and cannot be installed yet**. The GitHub Actions Android package workflow reproduces this build and retains the unsigned artifact. It does not receive signing secrets.

The maintainer signs distribution APKs with a private signing key using Android `apksigner`. Keep the same key for future updates; changing it requires a different app ID or uninstall/reinstall. Never commit the key or its password. Verify the signed APK before distribution with `apksigner verify --verbose --print-certs` and publish its SHA-256 digest alongside the download.

## Install and update

Download the signed distribution APK on the phone. Android may ask to allow installation from the app used to download it. The permission is specific to that source. Updates signed with the same key preserve the app's local storage; still back up before updating. Uninstalling or clearing data deletes the local copy.

Web and Android data are separate. Download a full JSON workspace backup on one device and restore it on the other. Old care-record backups remain a separate format accessible through **Settings → Previous care records**.

## Validation limits

Version 1.0.0 is a regular software release. Compilation, signature verification and automated checks do not establish compatibility with every phone or provider. Real-device coverage of launch, model calls, file pickers, PDF output, accessibility and the system Back action remains incomplete. Report reproducible problems with device and provider details, excluding API keys and personal records. Live model quality and clinical outcomes are not established by the APK build.
