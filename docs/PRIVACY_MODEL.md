# Privacy model and threat boundaries

Care Notes is designed for sensitive household and caregiving evidence. This document defines the intended privacy boundary for the v0.3 architecture. It is a design commitment, not a claim that the prototype has completed an external security audit.

## Principles

- **Local-first by default.** Evidence should remain on the user's device or explicitly chosen local infrastructure whenever practical.
- **Visible collection.** No covert-surveillance mode. Passive sources must be intentionally configured and reviewable.
- **Minimum necessary data.** Prefer structured event metadata over continuous raw audio/video.
- **Provenance over inference.** Store what the source observed and where it came from; do not silently invent stronger meaning.
- **Explicit cloud boundaries.** Sending any evidence to an external model/provider must be a separate, visible action with scoped input.
- **Patient and bystander privacy matter.** Household deployment must consider consent, legal basis and people who may be captured incidentally.

## Data classes

### Caregiver text
May contain names, medication details, behavior descriptions or other highly sensitive free text. Treat as private even when the user does not label it sensitive.

### Health/wearable records
Potentially sensitive personal health information. Real-device adapters should request only data types needed for configured features.

### Smart-home events
Motion, door and room-level events can reveal routines and occupancy. They are not harmless just because they are metadata.

### Camera metadata
Routine Care Notes ingestion should prefer structured Frigate-style event/review metadata. Continuous raw video should remain local by default and is outside the normal evidence pipeline.

### Derived episodes and summaries
A reconstruction may be more privacy-sensitive than any single source because it combines multiple signals. Derived outputs inherit the highest relevant privacy level of their evidence.

## Threats considered

1. **Accidental over-collection** — ingesting more sensors/entities than the user intended.
2. **Inference escalation** — turning weak observations into unsupported clinical or behavioral conclusions.
3. **Source outage confusion** — treating missing data as proof an event did not occur.
4. **Cloud leakage** — sending an entire timeline to a provider when only a small evidence subset was needed.
5. **Household account exposure** — another person with device/browser access reading local records.
6. **Raw-media expansion** — copying continuous camera/video data when event metadata was sufficient.
7. **Bystander exposure** — collecting information about visitors or household members who are not the configured subject.
8. **Prompt/data injection** — text from notes or external sources attempting to influence AI instructions.

## Required safeguards for future native releases

- per-source enable/disable controls;
- least-privilege Android permissions;
- source inventory showing exactly what is connected;
- clear indication of last successful sync and gaps;
- encrypted local storage for sensitive production data;
- export/delete controls;
- provider/BYOK configuration that never embeds secret keys in public frontend code;
- evidence subset preview before cloud model submission;
- deterministic validation of model outputs and evidence IDs;
- no background upload of continuous microphone or camera feeds;
- documented retention behavior for any optional hosted service.

## Camera boundary

Care Notes should not attempt to infer mental state from facial expressions or continuous surveillance video. The intended camera integration is low-level event evidence such as:

- a configured person/object event occurred in a room;
- repeated room-level activity events occurred during a time window;
- a locally retained clip/reference exists for a specific event.

These observations may support a timeline but do not prove sleep, mood, intent, diagnosis or crisis state.

## AI boundary

AI is optional infrastructure. The core reconstruction must remain reviewable without trusting a model as an authority.

A model may propose labels, relationships or prose only when every resulting claim can reference existing evidence IDs. Unsupported IDs, removed uncertainty and fabricated facts must be rejected or surfaced for human review.

## Current prototype limitations

The current web/PWA prototype stores personal journal data in browser localStorage without application-layer encryption. The v0.3 fictional episode demo does not contain real personal data. Real Android storage, encryption, permissions and device integration are not yet implemented.

Before a production-oriented native release, the privacy model should be reviewed against the actual Android architecture, local regulations and chosen integrations.
