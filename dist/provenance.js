// UTF-16 offsets match JavaScript's String.slice. The original is immutable.
export function cleanProvenance(p) {
  if (!p || typeof p !== 'object' || typeof p.original !== 'string' || !p.original.trim() || p.original.length > 5000 ||
      typeof p.quote !== 'string' || !p.quote.trim() || !Number.isInteger(p.start) || !Number.isInteger(p.end) ||
      p.start < 0 || p.end <= p.start || p.end > p.original.length || p.original.slice(p.start, p.end) !== p.quote ||
      !['local-rules', 'openai'].includes(p.method) || typeof p.batchId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(p.batchId)) {
    throw new Error('invalid_evidence');
  }
  return Object.fromEntries(['original', 'quote', 'start', 'end', 'method', 'batchId'].map(k => [k, p[k]]));
}
