import { CATEGORIES, SOURCES, CERTAINTIES } from './core.js';
import { localDraft, validateSuggestions, draftToRecords, UNCERTAIN } from './draft.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function openCapture({ dialog, labels: t, revision, getRevision, onSave, toast }) {
  let generation = 0, prepared = null, configured = false;
  const $ = s => dialog.querySelector(s);
  dialog.innerHTML = `<form id="capture-form">
    <div class="dialog-head"><h2>${escape(t.capture)}</h2><button class="close" type="button" aria-label="${escape(t.close)}" data-capture-close>×</button></div>
    <div class="form-body"><p>${escape(t.captureHint)}</p>
      <label class="field">${escape(t.captureInput)}<textarea id="capture-input" maxlength="5000" required rows="6" placeholder="${escape(t.captureSample)}"></textarea></label>
      <button type="button" class="btn ghost" id="capture-example">${escape(t.captureExample)}</button>
      <p class="notice">${escape(t.captureLocalHelp)}</p>
      <div class="actions"><button class="btn primary" type="button" id="capture-local">${escape(t.captureLocal)}</button></div>
      <details class="capture-ai" hidden><summary>${escape(t.captureAI)}</summary><p>${escape(t.captureAIHelp)}</p>
        <p id="capture-ai-status" role="status">${escape(t.captureAIUnavailable)}</p>
        <label class="capture-check"><input id="capture-consent" type="checkbox"> <span>${escape(t.captureConsent)}</span></label>
        <button class="btn line" type="button" id="capture-ai" disabled>${escape(t.captureAI)}</button>
      </details>
      <div id="capture-results" aria-live="polite"></div>
    </div><div class="dialog-actions"><button type="button" class="btn line" data-capture-close>${escape(t.cancel)}</button>
      <button type="submit" class="btn primary" id="capture-save" disabled>${escape(t.captureSave)}</button></div>
  </form>`;
  if (!dialog.open) dialog.showModal();
  const input = $('#capture-input');
  const invalidate = () => { generation++; prepared = null; $('#capture-results').replaceChildren(); $('#capture-save').disabled = true; };
  input.addEventListener('input', invalidate);
  dialog.querySelectorAll('[data-capture-close]').forEach(b => b.onclick = () => { generation++; dialog.close(); });
  $('#capture-example').onclick = () => { input.value = t.captureSample; invalidate(); input.focus(); };
  const select = (label, name, options, current) => `<label class="field">${escape(label)}<select name="${name}">${options.map(value => `<option value="${value}" ${value === current ? 'selected' : ''}>${escape(t[value])}</option>`).join('')}</select></label>`;
  function showDrafts(original, drafts, method) {
    if (revision !== getRevision()) { toast(t.captureChanged); return; }
    prepared = { original, drafts, method };
    $('#capture-results').innerHTML = `<h3>${escape(t.captureDrafts)} · ${drafts.length}</h3><p class="notice">${escape(t.captureDateHelp)}</p>
      ${UNCERTAIN.test(original) ? `<p class="notice">${escape(t.captureUncertain)}</p>` : ''}
      ${drafts.map((d, i) => `<fieldset class="capture-draft"><legend>${i + 1}</legend>
        <blockquote class="quote">${escape(d.quote)}</blockquote>
        <div class="form-grid">${select(t.category, `category-${i}`, CATEGORIES, d.category)}${select(t.source, `source-${i}`, SOURCES, d.source)}
          ${select(t.certainty, `certainty-${i}`, UNCERTAIN.test(original)?['uncertain']:CERTAINTIES, d.certainty)}<label class="field">${escape(t.eventDate)}<input type="date" name="date-${i}"></label></div>
        <label class="capture-check"><input type="checkbox" name="confirm-${i}" required> <span>${escape(t.captureConfirm)}</span></label>
      </fieldset>`).join('')}`;
    $('#capture-save').disabled = false;
  }
  $('#capture-local').onclick = () => {
    try { generation++; const original = input.value; showDrafts(original, localDraft(original), 'local-rules'); }
    catch { toast(t.captureBadInput); }
  };
  // This request sends no notes. Static hosting returns unavailable and remains useful offline.
  fetch('./api/status', { cache: 'no-store', signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null).then(status => {
    if (!dialog.open || !dialog.contains(input)) return;
    configured = status?.aiConfigured === true;
    $('.capture-ai').hidden = !configured;
    $('#capture-ai').disabled = !configured;
    $('#capture-ai-status').textContent = configured ? t.captureAIConfigured : t.captureAIUnavailable;
  }).catch(() => {});
  $('#capture-ai').onclick = async () => {
    if (!configured) return;
    if (!$('#capture-consent').checked) { toast(t.captureConsentNeeded); return; }
    const original = input.value;
    try { localDraft(original); } catch { toast(t.captureBadInput); return; }
    const ticket = ++generation;
    $('#capture-ai').disabled = true; $('#capture-ai-status').textContent = t.captureBusy;
    prepared = null; $('#capture-save').disabled = true; $('#capture-results').replaceChildren();
    try {
      const response = await fetch('./api/draft', { method: 'POST', headers: { 'Content-Type':'application/json', 'X-Care-Notes':'draft' }, body: JSON.stringify({ text: original, consent: true }), signal: AbortSignal.timeout(35000), cache:'no-store' });
      if (!response.ok) throw new Error('request_failed');
      const payload = await response.json();
      if (!dialog.open || !dialog.contains(input) || ticket !== generation || input.value !== original) return;
      showDrafts(original, validateSuggestions(original, payload), 'openai');
    } catch {
      if (dialog.open && dialog.contains(input) && ticket === generation) toast(t.captureFailed);
    } finally {
      if (dialog.open && dialog.contains(input)) { $('#capture-ai').disabled = !configured; $('#capture-ai-status').textContent = t.captureAIConfigured; }
    }
  };
  $('#capture-form').onsubmit = event => {
    event.preventDefault();
    if (!prepared || prepared.original !== input.value || getRevision() !== revision) { toast(t.captureChanged); return; }
    const data = new FormData(event.target);
    const decisions = prepared.drafts.map((d, i) => ({ id: d.id, category:data.get(`category-${i}`), source:data.get(`source-${i}`), certainty:data.get(`certainty-${i}`), date:data.get(`date-${i}`), confirmed:data.get(`confirm-${i}`) === 'on' }));
    try {
      const notes = draftToRecords(prepared.original, prepared.drafts, { method:prepared.method, decisions });
      if (onSave(notes)) { generation++; dialog.close(); toast(t.captureSaved); }
    } catch { toast(t.captureReviewNeeded); }
  };
}
