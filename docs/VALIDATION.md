# Validation record

Checked 2026-09-07 for v0.2.0.

| Check | Result | Scope |
| --- | --- | --- |
| Core data regressions | 10 passed | Backups, linking, summaries, corrections, filtering, translation keys |
| Draft and language checks | 10 passed | Exact quotes, Unicode, confirmation, evidence persistence, locale fallback |
| Provider/request checks | 7 passed | Mocked API contract, invalid results, missing configuration, consent, origin, size and rate limits |
| Live model calls | Not run | No model credentials configured or usage charged |
| Mobile/browser end-to-end checks | Not run | User testing remains necessary |
| Clinical/multilingual study | Not conducted | No accuracy or health-outcome claim |

Run `npm test` or `node --test tests/*.test.mjs`. Test inputs and credentials are fictional. Provider tests inject mocks and never call OpenAI. These small regression checks are not a benchmark of general intelligence, clinical usefulness, native-language quality or production security.
