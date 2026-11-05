# Clarification notebook / 待核对问题

Care Notes 1.3.0 closes the loop between a question, an attributed reply and a
human review. It works locally without an API key, alongside the coverage
firewall and handoff checkpoints.

## On your phone

1. Save the original accounts in **Accounts / 描述**.
2. Open **Results / 整理结果 → Clarification notebook / 待核对问题**.
3. Keep a suggested question, or write your own and select its source accounts.
4. Record who replied and their exact words. Include dates/periods if known.
5. Compare the reply with the original and current wording, then explicitly mark
   the reply reviewed. Nothing is automatically resolved or added to a model analysis.
6. If any account or declared observation coverage changes, earlier reviews show
   **Records changed · review again / 记录有变化 · 请重新核对**.
7. Export the notebook independently, or include it in the normal handoff text,
   clipboard and print/PDF output. Full workspace backups retain it.

中文：在“整理结果”中找到“待核对问题”，自己写问题并勾选相关原话，
或记下覆盖检查建议的问题。补充回答会保存成独立的新描述，注明是谁说的。
看过当前资料后再点“我已核对回答与当前记录”。之后原话、回答、其他描述
或观察范围变化，都会要求重新核对。旧原话与新原话会同时显示，撤下的
内容只作为历史对照。这里的“已核对”不是“已证实”。

## Evidence and revision rules

- Questions keep exact source IDs and versions. Replies are new ledger sources;
  their history is retained if they are later corrected or withdrawn.
- A human review saves the complete active source/version snapshot and validated
  coverage state. Status is computed from current data, never trusted from a backup.
- Any source addition, edit, withdrawal or coverage change invalidates that
  snapshot. This is deliberately conservative: a new, apparently unrelated account
  may contradict an earlier reply. A new model analysis alone does not complete a task.
- Re-review stores a fresh snapshot; original question/reply references and prior
  review actions remain available in the backup. Explicit reopening is also recorded.
- Suggested questions use the existing deterministic coverage audit (at most three).
  Supporting and opposing source references are retained. Suggestions are not a
  comprehensive question list or a clinical priority score.
- No automatic model call, source merge, clinical conclusion, coverage grant,
  diagnosis or medication instruction is produced by a reply or review action.

## Compatibility and limits

Existing version-1 backups without questions still load. The optional
`ledger.clarifications` field is validated on restore: up to 80 questions, 100
review actions per question, 1,000 characters per question, and the existing 40
source / 4 MB workspace limits. Replies consume source slots. A deleted source
still occupies a history slot; export a backup before starting another workspace.
Older app versions ignore the new field: do not round-trip a 1.3 backup through
an older version if you need to keep questions and review history.

New interface copy is Chinese/English, with English fallback in the other four
languages. Personal text is never translated. No multi-device synchronization,
delivery receipt, identity verification, cryptographic audit trail, clinical
validation or live-provider accuracy claim is made. Imported backups are local
user data, not signed evidence. Human review is a recorded user action, not proof
that the answer is correct.
