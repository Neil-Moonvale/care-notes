# Current website

Canonical public site: https://care-notes.muddycandy7.chatgpt.site

Sites project identity is retained in `.openai/hosting.json`. The managed source repository is separate from GitHub. Publish the matching source state and Worker build through Sites, preserving that project identity. `npm run build` embeds all public assets into `dist/server/index.js`; package the generated Worker and hosting manifest. Source credentials are short-lived and must never be committed.

The previous site belongs to a different ChatGPT account and is no longer the canonical entry. We cannot edit or redirect that origin. Users with records there must export a complete JSON workspace backup and restore it in the new site's Settings. API keys remain endpoint-scoped and outside backups. Updating the Android APK keeps its existing local data when installed over an older build with the same app ID/signature; back up first.

The replacement website is public, but records remain browser-local. The server relay accepts only the fixed official providers with explicit user consent; custom providers are called directly. No maintainer API key is supplied.
