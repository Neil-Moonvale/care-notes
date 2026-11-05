# Product research for 1.3.0

Reviewed 2026-11-05. This is a bounded product comparison, not an exhaustive
market survey or a claim of unique invention.

| Primary source | Relevant capability described by its authors | Implication for Care Notes |
| --- | --- | --- |
| [OpenCare](https://github.com/NexaFlowFrance/OpenCare) | Shared caregiving journal, care coordination and consultation/handoff preparation | Adding another journal or summary alone is a weak distinction. |
| [OwnChart](https://github.com/nickpdawson/OwnChart) | Immutable raw sources, human review of uncertain candidates and cited answers | Provenance and uncertainty review already exist elsewhere. |
| [HL7 FHIR R5 Provenance](https://hl7.org/fhir/R5/provenance.html) | Describes how information was created or revised and the entities involved | Explicit versions and attribution matter; a provenance link alone does not verify meaning. |

## Chosen increment

1.2 compares source records across handoff checkpoints. 1.3 makes unresolved
questions actionable: keep the source versions that motivated a question, capture
an independently attributed reply, record human review, and reopen the review
when the underlying workspace changes. The original account remains intact.

The focused combination is phone-first local use, observation-aware questions,
versioned evidence, correction-triggered re-review, and portable handoffs. This is
a specific implemented workflow, not a claim that no other project offers it.
FHIR influenced the importance of attribution; this release is not a FHIR
implementation or interoperability certification.

## Evaluation

Synthetic tests exercise preservation of original words, stale reviews after
correction/withdrawal/addition/coverage edits, restoration of old and new backups,
malformed references, history bounds, export wording, escaping and disabled writes.
Browser checks exercise the actual no-key workflow and persistence. These checks
do not establish medical validity, caregiver usefulness in a real trial, or model
accuracy. Independent caregiver feedback remains the next source of product evidence.
