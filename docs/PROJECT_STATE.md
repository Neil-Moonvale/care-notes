# Project status

Care Notes 0.3.1 development line · 2026-09-07

## Product invariant

Care Notes must remain useful with **one Android phone and one caregiver**. Additional hardware is optional. The primary product value is not note-taking or statistics; it is reconstructing a reviewable period from fragmented evidence while preserving what is known, conflicting and unknown.

## Available on `main`

- Local records, paragraph drafts, source excerpts, corrections and backup/restore.
- An episode workspace with explicit record selection, manually linked accounts, information checks and handoff export.
- Chinese, English and Spanish interface, help and fictional examples.
- Four main navigation items and an in-app usage guide.
- 39 checks passed in the latest verified `main` GitHub Actions run.

## Current feature branch

`feature/v0.3-phone-first-reconstruction` continues from the latest `main` without requiring any device integration.

Implemented there:

- conservative `same_episode_candidate` suggestions for unlinked records that share a category and are close in known time;
- no automatic linking or text-semantic claim of “same event”;
- explicit **Link these records / Not the same period** review controls;
- rejected candidates stored only as a local review preference and omitted from normal handoff output;
- accepted candidates use the existing manual-link model, so both original records remain separately reviewable;
- a fixed fictional phone-only multi-day fixture with expected candidates and expected non-candidates;
- regression tests for unsupported association, missing dates, uncertainty, rejection and no-network candidate UI behavior;
- six-language interface/help/demo/reconstruction coverage: Simplified Chinese, English, Spanish, French, Japanese and Korean;
- offline cache assets for all shipped language modules.

The six-language implementation has automated structural and workflow coverage, but no independent professional or clinical translation validation is claimed. The local drafting/classification rules remain primarily Chinese/English and require manual review in the other interface languages.

## Limitations

The current hosted/static workflow uses local deterministic rules. Automatic free-text semantic understanding, clinical conclusions, cross-device sync, native Android storage, Health Connect and other device integrations are not implemented.

The candidate rule is intentionally weak and review-only. Same category + close time is not proof of the same event. It is a prompt to compare source records, not an inference to put into the handoff.

## Next release gates

1. Verify the latest feature-branch CI run and fix regressions.
2. Test the full episode workflow on a real Android phone: capture, candidate accept/reject, manual clarification, export, backup and restore.
3. Switch through all six interface languages on the phone and review narrow-screen / enlarged-text behavior.
4. Review safety wording and translation quality based on that walkthrough; do not claim native-language validation without real review.
5. Keep PR #3 draft until the owner accepts the phone UI and wording.
6. After mobile acceptance, decide whether the next capability should be better review-question ranking, richer phone-only reconstruction, or the Android native shell. Do not add hardware integrations merely to make the project look advanced.

See [User guide](USER_GUIDE.md), [Roadmap](ROADMAP.md) and [Validation](VALIDATION.md).


## Evidence revision branch — 2026-09-07

`feature/evidence-revision-core` builds on `feature/v0.3-phone-first-reconstruction`. It adds immutable evidence revisions, attributed claims, typed relations, temporal and lineage constraints, stale-analysis rejection and a change report. The original overlay that only revealed a list while announcing reconstruction has been removed.

A six-language correction example is available at `reconstruction.html`. Its source annotations are authored; its changes and relations are computed locally. The optional server can request real structured extraction with explicit consent, and a separate model-summary baseline is available in the comparison CLI. No live model request or comparative usefulness measurement has been completed.

Next: review the phone example, run the model comparison with an explicitly configured budget, prepare an independent held-out set, and measure review effort. Preserve PR #3's main-release gate. Pause additional languages, native packaging, device integration and baseline-risk scoring. See [Reconstruction experiment](RECONSTRUCTION.md).
