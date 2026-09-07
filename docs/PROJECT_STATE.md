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
- localized candidate examples in Chinese, English and Spanish.

## Limitations

The current hosted/static workflow uses local deterministic rules. Automatic free-text semantic understanding, clinical conclusions, cross-device sync, native Android storage, Health Connect and other device integrations are not implemented.

The candidate rule is intentionally weak and review-only. Same category + close time is not proof of the same event. It is a prompt to compare source records, not an inference to put into the handoff.

## Next release gates

1. Verify the latest feature-branch CI run and fix regressions.
2. Test the full episode workflow on a real Android phone: capture, candidate accept/reject, manual clarification, export, backup and restore.
3. Review mobile layout and wording based on that walkthrough.
4. Create a clean draft PR from the phone-first branch to `main` and retire the older diverged v0.3 PR as superseded.
5. After mobile acceptance, decide whether the next capability should be better review-question ranking, richer phone-only reconstruction, or the Android native shell. Do not add hardware integrations merely to make the project look advanced.

See [User guide](USER_GUIDE.md), [Roadmap](ROADMAP.md) and [Validation](VALIDATION.md).
