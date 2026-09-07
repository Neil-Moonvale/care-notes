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

## v0.3.0

Eight episode regression checks added; all 35 local checks pass. Coverage includes excluded related accounts, no text leakage from excluded items, exact quotes, unknown dates, review changes, empty selection, no automatic association, immutability and language coverage. No browser end-to-end or live-model evaluation was performed.

## v0.3.1

39 local checks pass, including four new localization and demo-storage checks. Each shipped language has a full interface dictionary, help and episode labels. Language switching preserves separate demo edits and leaves personal data unchanged. Independent Spanish-language review and browser end-to-end testing have not been performed.


## Evidence revision experiment — 2026-09-07

The development checks exercise source revisions, exact quotations, non-observation, hearsay lineage, proposed conflicts, separate occurrences, ambiguous dates, temporal and lineage cycles, shared-time constraints, stale provider responses, source removal, declared cross-source dependencies, interpretation changes, and the six-language correction example. Packaging checks cover both entry pages and offline imports. Mock-provider checks cover consent, scoped input, refusals and invalid quotations.

The comparison runner completed a local fixture replay of 12 public development cases across 15 stages, with zero model calls and no kernel errors. This tests authored fault injections, not model performance. Real-model comparison, independent held-out cases, native-language review and caregiver task-time measurements remain pending. See [Reconstruction experiment](RECONSTRUCTION.md).
