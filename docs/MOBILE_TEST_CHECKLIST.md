# v0.3 Android phone walkthrough

Use **fictional demo data only** for this release gate.

This checklist is for the public `dist/episode-demo.html` experience after it is served over HTTP/HTTPS (for example GitHub Pages or a local server). Directly opening the HTML file from Android storage is not a supported test because the demo uses ES modules.

## Device / browser record

Before testing, note:

- Android version:
- phone model:
- browser and version:
- screen orientation:
- text/display scaling if changed from default:

## Core walkthrough

- [ ] Page opens without a blank screen or JavaScript error.
- [ ] Header, “发生了什么？” title and fictional-demo label are readable.
- [ ] Chinese/English switch works and does not lose the current view.
- [ ] Four overview counts fit without horizontal scrolling.
- [ ] Personal-baseline cards are readable at normal phone width.
- [ ] Data-gap card clearly says that missing evidence is **not** proof a real-world action did not happen.
- [ ] At least one reconstructed change cluster is visible.
- [ ] Baseline-deviation, unknown and conflict claims are visually distinguishable without relying only on color.
- [ ] Evidence relation pills are readable and do not overflow the card.
- [ ] Tapping an evidence ID scrolls to the matching source event.
- [ ] The focused evidence item is obvious after scrolling.
- [ ] “清除高亮 / Clear highlight” restores the full timeline.
- [ ] Raw source reference text wraps instead of forcing horizontal scrolling.
- [ ] No section requires pinch-zoom to read normal text.
- [ ] Rotating portrait ↔ landscape does not break layout.

## Accessibility / interaction checks

- [ ] Browser text-size increase to approximately 125–150% remains usable.
- [ ] Android system “remove/reduce animations” does not create distracting motion.
- [ ] Buttons have a large enough touch target and are not easy to mis-tap.
- [ ] Screen reader (if available) can reach language switch, evidence buttons and clear-highlight control.
- [ ] There is no information that can only be understood from color.

## Content / safety checks

The demo must **not** say any of the following unless directly supported by stronger evidence and human review:

- “insomnia” merely because the phone was active overnight;
- “medication not taken” merely because a pillbox source was offline;
- “did not eat” merely because a sensor did not observe kitchen activity;
- a psychiatric diagnosis based on movement, sleep, camera or caregiver-note fragments;
- a conflict is resolved when the two original accounts still disagree.

## Report a defect

For each defect, record:

1. what you tapped or scrolled;
2. what you expected;
3. what actually happened;
4. screenshot if the problem is visual;
5. phone/browser information above.

Do not include real patient or household data in screenshots or public GitHub issues.
