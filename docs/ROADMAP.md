# Roadmap / 开发路线

See [Project status](PROJECT_STATE.md) and [User guide](USER_GUIDE.md).

## Product rule

Care Notes should solve a difficult caregiving problem with the least required setup possible:

> **one Android phone + one caregiver must be enough for the core workflow.**

Wearables, Health Connect, smart-home events, cameras and other integrations are optional later evidence sources. They are not the product and must not become prerequisites.

## Working prototype on `main`

- [x] Local recording, paragraph capture, original evidence, corrections and backups.
- [x] Chinese / English / Spanish interface and localized fictional examples.
- [x] Episode workspace: explicit selection, manually linked accounts, missing-information prompts, incomplete-group warnings and handoff export.
- [x] Optional AI classification adapter with mocked contract tests; not required by the episode workflow.
- [x] Public MIT source and GitHub Actions checks.

## Current phone-first reconstruction branch

- [x] Fixed fictional multi-day case using only caregiver/self phone records; no extra hardware.
- [x] Conservative review candidates for unlinked records with the same category and close known time.
- [x] Candidate output keeps evidence IDs and never automatically merges records.
- [x] Explicit accept and reject controls in the phone-friendly episode workspace.
- [x] Rejected candidates remain a local review preference and stay out of the normal handoff.
- [x] Accepted candidates keep both original source records separately reviewable.
- [x] Tests for expected candidates and expected non-candidates, missing dates, uncertainty and no silent association.

## Before this branch can merge

- [ ] Latest CI must be green after all documentation/UI changes.
- [ ] Real Android phone walkthrough: capture → reconstruct → accept/reject candidate → clarify → export → backup/restore.
- [ ] Check narrow-screen layout, enlarged text and browser behavior.
- [ ] Confirm user-facing wording never makes a candidate sound like a fact.
- [ ] Create a clean replacement PR to `main`; close the older diverged v0.3 PR as superseded rather than trying to merge it blindly.

## Next meaningful capability after the merge

The next work should make the reconstruction feel more useful, not merely more complex:

- [ ] Improve clarification questions so the app asks fewer, more consequential questions.
- [ ] Add richer fictional cases with sparse days, conflicting accounts and later corrections; measure omissions, unsupported associations and review effort.
- [ ] Explore evidence-bound semantic suggestions only if every proposal remains rejectable and traceable to source IDs.
- [ ] Design the Android native shell around the same episode workflow, quick capture, local storage and export.
- [ ] Add a personal-baseline/change view only when it provides actionable context beyond ordinary charts.
- [ ] Later, optionally integrate Health Connect or other consented sources without weakening the one-phone/no-extra-hardware path.

## Not product goals

- generic mood tracking or statistics as the main experience;
- requiring smart-home or camera infrastructure;
- automatic diagnosis;
- medication adjustment advice;
- automatic hospital-admission decisions;
- invented certainty when evidence is missing;
- silently resolving conflicting accounts;
- “AI understood it” claims without evidence-bound evaluation.

The OpenAI open-source support application is a project goal, but development and release claims must remain based on real code, real maintenance and real external feedback. Do not manufacture stars, users, issues or adoption.
