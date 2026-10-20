# Handoff Change Review / 交接变化核对

1. Open **Results / 整理结果** and review the current accounts, conflicts and unknowns.
2. Use the existing **review** action in the export section, then **Save handoff checkpoint / 保存交接基准**.
3. Add, correct or withdraw accounts. Open Results again. Expand New, Corrected or Withdrawn accounts to inspect exact wording and source versions.
4. Review current Results again before exporting the separate change list. Coverage changes need review of the current coverage map.
5. Save a replacement checkpoint only when you want subsequent comparisons to start from the current records. Replacement asks for confirmation and retains original source history.

中文：先在结果页核对原话、冲突与未知，点击已有的“已核对”操作，再保存交接基准。补充、更正或撤下描述后，回到结果页展开对应分组查看前后原话。再次核对后可导出变化清单。替换基准会确认，不删除原始版本历史。

The checkpoint contains a timestamp, historical source ID/version references and a snapshot of declared observation coverage. It lives in the same device-local workspace and backup as the accounts. It contains no API credentials. Restore validates references against the full source history and recomputes differences; imported difference summaries are not trusted. Older backups start without a checkpoint. Demo checkpoints stay in the fictional workspace and do not replace personal data.

Only one comparison checkpoint is retained. This is a source-document comparison, not an AI report diff, clinical trend detector, delivery receipt, recipient acknowledgement, or cross-device synchronization. A newly added and then withdrawn account that was never in the checkpoint is not listed as a withdrawal. Editing text back to its original wording still changes its source version and appears as a correction. Declared-coverage revision changes conservatively trigger review even if an edit was later reverted. Model re-analysis alone does not change the source comparison.

The change-list export includes historical and current personal text. Review it before sharing, just as you would a full handoff. This is a text export; backup/restore remains the mechanism for transferring the complete workspace.

Feature copy is complete in English and Simplified Chinese; other interface languages use English fallback. No model call or new external service is required.
