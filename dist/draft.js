import { CATEGORIES, SOURCES, CERTAINTIES, validDate, validateBackup } from './core.js';

export const UNCERTAIN = /不确定|不知道|拿不准|可能|或许|大概|好像|是否|有没有|没看见|没有看到|没有亲眼|不清楚|\b(?:unsure|uncertain|perhaps|maybe|might|not sure|do not know|don't know|whether|did not see|didn't see|approximately)\b/iu;
export function segmentText(original) {
  if (typeof original !== 'string' || !original.trim() || original.length > 5000) throw new Error('invalid_input');
  const boundary = /[。！？!?；;\n]+|\.(?=\s|$)|[，,](?=\s*(?:妈妈|爸爸|家属|本人|她自己|他自己|母亲|父亲|the patient|patient|mother|father|they said|I said))/giu;
  const segments = []; let start = 0;
  const add = end => {
    let a = start, b = end;
    while (a < b && /\s/u.test(original[a])) a++;
    while (b > a && /\s/u.test(original[b - 1])) b--;
    if (b > a) segments.push({ id: `s${segments.length + 1}`, start: a, end: b, quote: original.slice(a, b) });
    start = end;
  };
  for (const m of original.matchAll(boundary)) add(m.index + m[0].length);
  add(original.length);
  if (!segments.length || segments.length > 40) throw new Error('too_many_segments');
  return segments;
}
function guessCategory(text) {
  const rules = [
    ['medication', /服药|吃药|药物|药量|\b(?:medicine|medication|dose|tablet|pill)\b/iu],
    ['sleep', /睡|失眠|\b(?:sleep|slept|awake|insomnia|bedtime)\b/iu],
    ['food', /吃饭|午饭|晚饭|早饭|早餐|午餐|晚餐|米饭|喝水|喝汤|\b(?:meal|lunch|dinner|breakfast|rice|water|soup|food)\b/iu],
    ['visit', /医院|复诊|就诊|住院|\b(?:appointment|hospital|clinic|visit)\b/iu],
    ['mood', /觉得|感到|喊叫|心情|累|\b(?:felt|feeling|tired|shouted|upset)\b/iu],
  ];
  const matches = rules.filter(([, re]) => re.test(text));
  return matches.length === 1 ? matches[0][0] : 'other';
}
function guessSource(text) {
  const self = /本人|她自己|他自己|患者说|\b(?:patient said|self-report)\b/iu.test(text);
  const family = /妈妈|爸爸|母亲|父亲|家属|\b(?:mother|father|family|sibling)\b/iu.test(text);
  const clinician = /医生|医嘱|\b(?:doctor|clinician|prescribed)\b/iu.test(text);
  if (Number(self) + Number(family) + Number(clinician) !== 1) return 'unknown';
  return self ? 'self' : family ? 'family' : 'clinician';
}
export function localDraft(original) {
  const segments = segmentText(original);
  // Carry uncertainty conservatively across the paragraph; no clause loses its context.
  const uncertain = UNCERTAIN.test(original);
  return segments.map(s => ({ ...s, category: guessCategory(s.quote), source: guessSource(s.quote), certainty: uncertain ? 'uncertain' : 'reported' }));
}
export function validateSuggestions(original, payload) {
  const segments = segmentText(original);
  if (!payload || Object.keys(payload).length !== 1 || !Array.isArray(payload.suggestions) || payload.suggestions.length !== segments.length) throw new Error('invalid_suggestions');
  const seen = new Set();
  for (const s of payload.suggestions) {
    if (!s || Object.keys(s).sort().join(',') !== 'category,certainty,id,source' || !segments.some(x => x.id === s.id) || seen.has(s.id) ||
        !CATEGORIES.includes(s.category) || !SOURCES.includes(s.source) || !CERTAINTIES.includes(s.certainty)) throw new Error('invalid_suggestions');
    seen.add(s.id);
  }
  return segments.map(segment => {
    const s = payload.suggestions.find(x => x.id === segment.id);
    return { ...segment, category: s.category, source: s.source, certainty: UNCERTAIN.test(original) ? 'uncertain' : s.certainty };
  });
}
export function draftToRecords(original, suggestions, { method = 'local-rules', batchId = crypto.randomUUID(), now = new Date().toISOString(), decisions = [] } = {}) {
  if (!['local-rules', 'openai'].includes(method)) throw new Error('invalid_method');
  const clean = validateSuggestions(original, { suggestions: suggestions.map(({ id, category, source, certainty }) => ({ id, category, source, certainty })) });
  if (decisions.length !== clean.length) throw new Error('review_required');
  const records = clean.map((s, i) => {
    const d = decisions[i];
    if (!d || d.id !== s.id || d.confirmed !== true || !CATEGORIES.includes(d.category) || !SOURCES.includes(d.source) || !CERTAINTIES.includes(d.certainty) || !(d.date === '' || validDate(d.date))) throw new Error('review_required');
    return {
      id: crypto.randomUUID(), text: s.quote, category: d.category, source: d.source,
      // Explicit uncertainty in the original cannot disappear during import.
      certainty: UNCERTAIN.test(original) ? 'uncertain' : d.certainty,
      date: d.date, time: '', when: '', author: '', group: '', review: 'pending', reviewNote: '', createdAt: now, updatedAt: now, history: [],
      provenance: { original, quote: s.quote, start: s.start, end: s.end, method, batchId },
    };
  });
  return validateBackup({ format: 'care-notes', version: 2, records });
}
