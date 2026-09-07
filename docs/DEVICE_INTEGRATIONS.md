# Device integrations

Care Notes treats integrations as **evidence adapters**, not as diagnosis engines. Each adapter converts a source-specific record into the canonical Care Evidence Schema while preserving the original source reference and uncertainty.

## Integration contract

An adapter should:

1. keep a stable source/reference ID;
2. preserve the observation time separately from ingestion time;
3. emit the lowest-level fact the source actually supports;
4. never infer a diagnosis, intent or medication adherence from a weak signal;
5. expose source availability and gaps explicitly;
6. avoid copying sensitive raw media when metadata is sufficient.

Current prototype adapter functions live in `dist/adapters.js`.

## Health Connect

Target use: sleep sessions, activity and selected health/fitness records that a user explicitly permits.

The prototype sleep adapter converts a source sleep interval into a `sleep_duration` evidence event. It does **not** convert a short sleep record into `insomnia`, `mania`, `depression`, relapse or crisis risk.

Real Android integration will require Android permission handling, source attribution, background-read policy review and device testing.

## Home Assistant

Target use: explicit household events such as room motion, doors, locks and other configured entities.

A Home Assistant state change remains a state change. For example:

- motion `on` -> room activity observed;
- a lock transition -> door/lock event observed;
- missing motion -> **not** proof that a person was absent, asleep or inactive.

Entity selection must be explicit. Care Notes should not silently ingest an entire Home Assistant installation.

## Frigate

Target use: structured review/event metadata from a locally operated Frigate installation.

Routine ingestion should prefer metadata such as event ID, camera, time, label and zone. Raw continuous video stays local by default. A metadata event such as `person in living_room` is not a mood, diagnosis or intent label.

## Caregiver observations

Human observations remain first-class evidence and retain the original wording. Structured labels may be added, but the original note stays available for review. Two caregivers may disagree; Care Notes keeps the conflict visible rather than choosing a winner.

## Source status / missingness

A missing record is ambiguous. The prototype uses explicit source states:

- `available`
- `sensor_offline`
- `permission_unavailable`
- `not_synced`
- `no_event_observed`

These states are not interchangeable. In particular, `no_event_observed` and `sensor_offline` must never be upgraded into a statement that a real-world action did not happen.

## Planned real-device order

1. Android Health Connect read-only adapter;
2. Home Assistant REST/webhook-shaped adapter;
3. Frigate event metadata adapter;
4. source-health diagnostics and permission-gap UI;
5. optional additional sources only after privacy and usefulness review.

The web demo uses fictional records so development and review do not require paid APIs, a camera, a wearable or a smart-home installation.
