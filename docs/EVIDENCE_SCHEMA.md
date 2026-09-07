# Care Evidence Schema

Care Notes v0.3 normalizes heterogeneous observations into small evidence events before any episode reconstruction occurs.

## Design goals

- preserve provenance;
- separate observation from interpretation;
- keep unknowns explicit;
- support human and device sources;
- make AI outputs reference stable evidence IDs;
- allow deterministic validation.

## Canonical evidence event

```json
{
  "event_id": "ev_2026-09-05_0317_motion_01",
  "source_type": "frigate",
  "source_id": "living_room_camera",
  "observed_at": "2026-09-05T03:17:00+08:00",
  "received_at": "2026-09-05T03:17:03+08:00",
  "event_type": "room_activity",
  "value": "motion_detected",
  "unit": null,
  "confidence": 0.98,
  "subject": "person_a",
  "human_confirmed": false,
  "privacy_level": "household",
  "raw_reference": "frigate:event:abc123",
  "provenance": {
    "adapter": "frigate",
    "adapter_version": "0.1",
    "derived": false
  }
}
```

## Required semantics

### `event_id`

Stable identifier used by timelines, graph edges and AI citations. It must not be recycled for a different observation.

### `source_type`

Examples: `caregiver_note`, `health_connect`, `home_assistant`, `frigate`, `medication`, `simulator`.

### `observed_at` vs `received_at`

`observed_at` is when the event occurred or was observed. `received_at` is when Care Notes ingested it. They may differ.

### `event_type`

Describes the low-level observation, not a diagnosis. Examples: `room_activity`, `door_open`, `sleep_session`, `step_count`, `heart_rate`, `caregiver_observation`, `pillbox_open`.

### `confidence`

Confidence in the observation itself, not confidence in a clinical interpretation. A camera event can be highly reliable while its meaning remains uncertain.

### `raw_reference`

Pointer to the originating record or local clip/event ID when one exists. Raw data need not be copied into the normalized event.

### `human_confirmed`

Indicates whether a person has reviewed the normalized observation or derived record. It is not equivalent to medical verification.

## Evidence graph edge

```json
{
  "edge_id": "edge_001",
  "from": "ev_001",
  "to": "ev_002",
  "relation": "same_episode",
  "confidence": 0.74,
  "proposed_by": "local_rules",
  "human_confirmed": false,
  "reason": "temporal proximity and same overnight window"
}
```

Allowed initial relations:

- `supports`
- `conflicts_with`
- `same_episode`
- `baseline_deviation`
- `derived_from`
- `uncertain_about`

## Derived episode record

```json
{
  "episode_id": "ep_2026-09-05_night",
  "start_at": "2026-09-05T02:13:00+08:00",
  "end_at": "2026-09-05T08:20:00+08:00",
  "status": "needs_review",
  "evidence_ids": ["ev_001", "ev_002", "ev_003", "ev_004"],
  "claims": [
    {
      "text": "Nighttime activity was higher than the recent personal baseline.",
      "evidence_ids": ["ev_001", "ev_002"],
      "claim_type": "baseline_deviation",
      "certainty": "supported"
    },
    {
      "text": "Medication status is unknown.",
      "evidence_ids": ["ev_004"],
      "claim_type": "unknown",
      "certainty": "unknown"
    }
  ]
}
```

## Validation rules for AI-assisted outputs

A proposed claim should be rejected or flagged when:

1. it references an evidence ID that does not exist;
2. it contains no evidence IDs;
3. it changes the source observation into a stronger fact without support;
4. it removes an explicit uncertainty;
5. it claims a conflict is resolved when the evidence remains conflicting;
6. it fabricates times, people, medication status or clinical meaning;
7. it duplicates the same evidence under multiple invented identities.

Examples of semantic upgrades that should be blocked or reviewed:

| Evidence | Unsupported upgrade |
| --- | --- |
| phone active overnight | insomnia |
| pillbox not opened | medication not taken |
| kitchen motion absent | did not eat |
| increased pacing events | manic episode |
| caregiver says “seemed low” | depression diagnosis |

## Missingness is evidence context

Absence of an event is not automatically evidence that the real-world action did not happen. Adapters should expose source availability and gaps so reconstruction can distinguish:

- `no event observed`;
- `sensor offline`;
- `permission unavailable`;
- `data not yet synced`;
- `person did not confirm`.

This distinction is essential to avoid false certainty.
