# Android phone walkthrough checklist

Use fictional data only. This checklist validates the current web/PWA prototype on a real Android phone before PR #3 can merge. It is not clinical validation.

## Device note

Record:

- phone model;
- Android version;
- browser and browser version;
- portrait / landscape tested;
- whether browser text size or Android display size was enlarged.

## 1. Open and basic layout

- [ ] App opens without a blank screen.
- [ ] No horizontal scrolling is required at normal portrait width.
- [ ] Main controls can be tapped without zooming.
- [ ] Chinese, English and Spanish can be switched without losing personal records.
- [ ] “How to use / 怎么用” opens and closes normally.

## 2. Phone-only episode flow

In the fictional demo:

- [ ] Open **Review an episode / 整理经过**.
- [ ] Six fictional records are visible in the current-language demo.
- [ ] A **may belong to the same change period / 可能属于同一段变化** candidate appears for the two food records.
- [ ] The candidate clearly says it is only a review suggestion, not a fact.
- [ ] Both source records remain readable before any decision.

## 3. Reject path

- [ ] Tap **Not the same period / 不是同一段**.
- [ ] The candidate disappears.
- [ ] Neither source record is deleted or altered.
- [ ] Downloaded handoff does not contain the rejected candidate as evidence or a conclusion.
- [ ] Reloading the page does not immediately re-show the rejected candidate.
- [ ] Resetting the fictional demo allows the candidate to appear again.

## 4. Accept path

Reset the fictional demo first.

- [ ] Tap **Link these records / 关联这两条**.
- [ ] The page reloads and the candidate disappears because the records are now manually linked.
- [ ] Both original records still appear separately.
- [ ] The linked-account review does not decide which account is correct.
- [ ] The downloaded handoff preserves both source records and their IDs.

## 5. Missing and uncertain information

- [ ] An uncertain statement remains marked uncertain after reconstruction.
- [ ] An unknown date remains unknown; the app does not invent a precise date from prose.
- [ ] An uncertain medication account does not become “missed dose” or medication advice.
- [ ] “No checks triggered” wording does not imply that the situation is safe or complete.

## 6. Capture and export

Using only fictional text:

- [ ] Capture a paragraph and confirm its extracted pieces.
- [ ] Save a manual record.
- [ ] Edit it and confirm the original/correction history remains available.
- [ ] Export an episode handoff.
- [ ] Export a backup.
- [ ] Restore that backup and verify the fictional records remain intact.

## 7. Accessibility / stress checks

- [ ] Increase browser/Android text size and repeat the episode candidate flow.
- [ ] Rotate to landscape and back to portrait.
- [ ] Buttons remain visible and tappable.
- [ ] Long record text wraps instead of overflowing.
- [ ] Keyboard focus is visible when tested with a hardware keyboard or accessibility navigation, if available.

## Report a defect

For each problem, record:

1. exact step;
2. what you expected;
3. what happened;
4. phone / Android / browser version;
5. screenshot if useful.

Do not put real patient names, medical records, household camera material or other private data in a public issue.
