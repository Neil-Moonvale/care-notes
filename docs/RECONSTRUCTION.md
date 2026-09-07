# Evidence revision experiment

This development branch adds a small, reusable reconstruction core and an interactive correction example. It does not establish that Care Notes outperforms a language model or improves clinical outcomes.

## Try it

Open `reconstruction.html` from the existing app's **Try evidence correction** link. The initial four accounts and their extraction annotations are fictional and authored. The relations, open question, source-version invalidation and change report are computed by the shared core in the browser.

1. Read the accounts. The self-report has no established date. A caregiver's non-observation does not establish an absence, and another caregiver's retelling is identified as hearsay.
2. Apply the explicit date correction. The original version remains available. The tentative same-event link is withdrawn, the corrected account moves to its new period, and the unchanged medication account remains unknown.
3. Edit any original text. Claims depending on that version stop being current immediately. Unanalysed sources remain visible; the app does not pretend to understand the edit using fixture annotations.
4. Download the review material to keep original versions, current output and changes. This temporary page does not change the existing care-record store. Reloading resets it. Downloaded files can contain sensitive original text.

The interface and built-in examples support the existing six languages. Edits to original text are retained when changing the interface language. These translations have structural and example-flow checks, not independent native-speaker validation.

## Components

| File | Responsibility |
|---|---|
| `dist/reconstruction-core.js` | Source versions, exact quotation validation, attributed claims, proposed relations, temporal constraints, lineage cycles, stale-result rejection, change reports and bounded clarification questions |
| `server/reconstruction.js` | OpenAI structured extraction and a separate strong-prompt handoff baseline, with the same model/input/output-token ceiling |
| `dist/reconstruction-demo.js` | Explicitly authored example annotations and a manual date correction; no free-text parser or simulated model response |
| `scripts/evaluate-reconstruction.mjs` | Reproducible fixture replay and opt-in live-model comparison, including corrected-input stages |

The core uses plain JavaScript data structures, with no database or framework dependency. Node and the browser execute the same module. Existing note backups are unchanged; the experimental review JSON is a separate format and is not imported as a normal record backup.

## Evidence model and limits

Sources have immutable revisions. Claims reference a particular version and an exact, unique quotation with locally calculated offsets. A claim records the subject, original observer, topic, basis, polarity and a time range separately from the report timestamp. Cross-source interpretations declare supporting source versions and exact quotations. Correcting a supporting source also invalidates dependent interpretations of otherwise unchanged originals. These declared dependencies are checked; the core cannot detect reasoning dependencies that a model failed to declare. Direct descriptions are still attributed accounts, not verified facts.

Relations distinguish `same_event`, `contradicts`, `reported_from` and `before`. They remain proposals. The core withdraws stale relations, rejects impossible known-time associations, checks same-event chains for a common possible time, and rejects cyclic temporal order or source lineage. Unknown dates stay unknown. Automatic display order and derived temporal order do not establish causation.

An exact quotation and valid schema do not prove that the model chose the right subject, event, time anchor or relation. A conservative lexical guard catches some non-observation and uncertainty expressions, including selected multilingual forms; it is not complete semantic understanding. Different observation windows, vague quantities and subtle scope/negation still require evaluation and human review. Hearsay about a non-observation retains its report lineage while occurrence stays unknown.

Current questions use transparent information rules: missing time on a proposed relation, or an untraced reported source. They are capped and can be skipped. They are not calibrated information-gain estimates or clinical-priority rankings.

Old source versions are retained in the in-memory ledger for review. Removing a source withdraws dependent active output but does not purge its history; do not describe this as permanent erasure. Original care-record deletion retains its existing behavior.

## Optional real model

The static Pages/Sites demo does not provide a model service or include any API key. The existing personal loopback server now also accepts `/api/reconstruct` after explicit consent and same-origin checks. Configure `OPENAI_API_KEY` and `OPENAI_MODEL` locally as described in [AI setup](AI.md), then run the local server. Use the page's AI action to analyse the current source snapshot. A response arriving after a saved edit is rejected.

This local-server arrangement does not provide a mobile hosted backend. Public server deployment still requires authentication, user separation and explicit operating limits. The example works on a phone without that backend.

No live model comparison was run for this change. Provider tests use mocks. No credentials belong in the repository, browser, review export or issue reports.

## Reproduce the checks

```sh
node --test tests/*.test.mjs
node scripts/evaluate-reconstruction.mjs --dry-run
```

The replay uses 12 public development cases and 15 stages, including three corrected-input stages. Its authored proposals deliberately include faults. It exercises the constraints; it is not a held-out model benchmark. The report explicitly says `fixture_replay`, records zero model requests and leaves human-review metrics unscored.

For an intentionally limited live run, after configuring server-side environment variables:

```sh
node scripts/evaluate-reconstruction.mjs --live --limit 2 --max-requests 6 --max-output-tokens 6000
```

There are six requests: two initial cases, one additional corrected stage, and two arms per stage. One arm asks the model directly for an evidence-linked handoff; the other requests claims and relations and applies the core. Both see the same current sources and use the same configured model and token ceiling. The structured response is also retained before constraints, allowing inspection of what the core changed. Requests are sequential and are not retried automatically. The full development comparison plans 30 requests and requires an explicit budget.

Outputs go to ignored `evaluation-results/`. Do not publish outputs from personal care records. The CLI currently uses only the included fictional development cases.

The report retains raw outputs, model identifiers, token usage, errors, timing and blank human-review fields. Compare unsupported assertions, incorrect event links, important omissions and review effort. An independent held-out set and actual caregiver review are still needed. No numerical usefulness or superiority result is claimed.
