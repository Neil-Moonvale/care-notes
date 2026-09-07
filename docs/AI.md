# AI contract and deployment boundary

1. Local segmentation creates fixed IDs, exact quotes and UTF-16 offsets from the paragraph.
2. Local rules provide a free path, clearly labeled as rules.
3. An explicitly consented AI request sends only this paragraph through the same-origin server to OpenAI.
4. Strict structured output allows only category, source and certainty per fixed ID.
5. Validation requires each ID exactly once and forbids extra fields, invented IDs and rewritten quotes. Quotes and offsets are reconstructed locally.
6. Recognized uncertainty is conservatively applied across the paragraph, potentially over-labeling unrelated sentences. This is not a semantic guarantee across all languages.
7. Every draft requires review before saving. Dates stay blank until supplied; event linking stays manual.
8. Original paragraphs remain attached when a person corrects a note.

These checks do not prove clinical correctness, truth, authorship or cryptographic integrity. A model can misclassify sources and miss subtle uncertainty. Human review is required. No diagnosis, treatment advice or automated contradiction verdict is generated.

## Status and controls

The optional Node.js adapter and consent UI are implemented. Provider tests are mocked. No live model request, paid usage or credential was activated. The hosted Sites preview is static and does not execute `server/`.

The personal server binds to `127.0.0.1`, checks host/origin and a custom header, requires consent, limits input, permits one active call and ten calls per minute. Limits reset on restart. This is not public multi-user billing protection; do not expose it through a tunnel.

Hosted AI requires a separate authenticated backend, per-user quotas, operational review and explicit cost approval. Model selection is explicit, with no model charged by default.

[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · [Responses API and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses)

`store: false` disables stored Responses state, not every form of infrastructure/provider retention. Review current policies before sensitive use.


## Experimental reconstruction

The same local configuration enables `/api/reconstruct` on the [evidence revision page](RECONSTRUCTION.md). It sends only the explicitly consented current accounts, source names and recording timestamps. The API validates exact quotation references, while the client rejects responses to old source versions. The public static demo does not expose this server or a paid model service.
