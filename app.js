import { parseDeck, renderSlide, speakerNotesText, MAX_SOURCE } from './src/markdown.js';

const $ = id => document.getElementById(id);
const source = $('source');
const presentLayer = $('presentation');
const STORE_KEY = 'markdown-slides:draft:v1';
const THEME_KEY = 'markdown-slides:theme:v1';
const SAMPLE = [
  '# The future of your ideas',
  '### A presentation made with Markdown',
  '',
  '**One text file.** A complete slide deck.',
  '',
  '---',
  '# Why Markdown?',
  '',
  '- Focus on the message, not the toolbar',
  '- Move slides with plain text',
  '- Share your deck as a portable .md file',
  '- Present straight from your browser',
  '',
  '???',
  'Speaker note: Start with the story, not the features.',
  '',
  '---',
  '## A tiny example',
  '',
  '1. Write a heading',
  '2. Add a **bold** idea or an *emphasis*',
  '3. Separate slides with three hyphens',
  '',
  '> Simplicity makes room for clarity.',
  '',
  '---',
  '# Code belongs in presentations',
  '',
  '    const idea = "Make it understandable";',
  '',
  '---',
  '# Questions?',
  '',
  'Built with [Markdown Slides](https://github.com/MeiRR17/markdown-slides)',
].join('\n');
let slides = [];
let selected = 0;
let showing = false;
let draftTimer = null;
let deckRevision = 0;
let importRequest = 0;
let clockTimer = null;
let clockStartedAt = null;
let clockElapsed = 0;
let clockPaused = false;


function message(value, kind = '') {
  $('message').textContent = value;
  $('message').className = 'message' + (kind ? ' ' + kind : '');
}
function stored(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveDraft() {
  try { localStorage.setItem(STORE_KEY, source.value); }
  catch { message('Browser storage is unavailable or full. Export your Markdown to preserve the deck.', 'error'); }
}
function setTheme(value) {
  const theme = ['light', 'midnight', 'sand'].includes(value) ? value : 'light';
  document.body.dataset.theme = theme;
  $('theme').value = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* In-memory theme still works. */ }
}
function formatClock(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remainder = seconds % 60;
  return (hours ? String(hours).padStart(2, '0') + ':' : '') +
    String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
}
function currentElapsed() {
  return clockElapsed + (clockStartedAt === null ? 0 : performance.now() - clockStartedAt);
}
function updateClock() {
  $('present-clock').textContent = formatClock(currentElapsed());
  $('present-pause').textContent = clockPaused ? '▶ Resume' : 'Ⅱ Pause';
  $('present-pause').setAttribute('aria-pressed', String(clockPaused));
}
function startClock() {
  stopClock();
  clockElapsed = 0;
  clockPaused = false;
  clockStartedAt = performance.now();
  clockTimer = setInterval(updateClock, 250);
  updateClock();
}
function stopClock() {
  if (clockTimer !== null) clearInterval(clockTimer);
  clockTimer = null;
  clockStartedAt = null;
}
function toggleClock() {
  if (!showing) return;
  if (clockPaused) {
    clockStartedAt = performance.now();
  } else {
    clockElapsed = currentElapsed();
    clockStartedAt = null;
  }
  clockPaused = !clockPaused;
  updateClock();
}
function resetClock() {
  clockElapsed = 0;
  if (!clockPaused) clockStartedAt = performance.now();
  updateClock();
}

function renderSelected() {
  const total = slides.length;
  selected = Math.max(0, Math.min(selected, total - 1));
  const slide = slides[selected];
  if (slide) {
    renderSlide(slide, $('slide-body'));
    renderSlide(slide, $('present-body'));
  } else {
    $('slide-body').replaceChildren();
    $('present-body').replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-slide';
    empty.textContent = 'Write your first slide to start.';
    $('slide-body').append(empty);
  }
  const position = total ? selected + 1 : 0;
  $('slide-number').textContent = position + ' / ' + total;
  $('present-number').textContent = position + ' / ' + total;
  $('present-position').textContent = position + ' / ' + total;
  $('present-jump').max = String(Math.max(1,total));
  $('present-jump').value = String(Math.max(1,position));
  const progress = total ? Math.round(position / total * 100) : 0;
  $('present-progress-fill').style.width = progress + '%';
  $('present-progress').setAttribute('aria-valuenow', String(progress));
  $('position').textContent = 'Slide ' + position + ' of ' + total;
  $('slide-count').textContent = total + (total === 1 ? ' slide' : ' slides');
  $('notes').textContent = slide?.notes || 'Add notes after ??? on a slide.';
  $('previous').disabled = $('present-previous').disabled = position <= 1;
  $('next').disabled = $('present-next').disabled = position >= total;
  $('present').disabled = total === 0;
  $('export-notes').disabled = !slides.some(slide => slide.notes.trim());

  $('outline').querySelectorAll('[data-slide]').forEach(button => {
    const active = Number(button.dataset.slide) === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'true' : 'false');
  });
}
function buildOutline() {
  const outline = $('outline');
  outline.replaceChildren();
  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.slide = String(index);
    const number = document.createElement('b');
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.textContent = slide.title;
    button.append(number, label);
    button.addEventListener('click', () => {
      selected = index;
      renderSelected();
    });
    outline.append(button);
  });
}
function updateDeck() {
  $('char-count').textContent = source.value.length.toLocaleString() + ' chars';
  try {
    const parsed = parseDeck(source.value);
    slides = parsed;
    selected = Math.max(0, Math.min(selected, slides.length - 1));
    buildOutline();
    renderSelected();
    message('');
  } catch (error) {
    message(error.message || 'Could not read the deck.', 'error');
    slides = [];
    buildOutline();
    renderSelected();
  }
}
function changeSlide(delta) {
  const next = selected + delta;
  if (next >= 0 && next < slides.length) {
    selected = next;
    renderSelected();
  }
}
function enterPresentation() {
  if (!slides.length) return;
  showing = true;
  startClock();
  presentLayer.hidden = false;
  document.body.classList.add('presenting');
  renderSelected();
  $('present-next').focus();
  if (typeof presentLayer.requestFullscreen === 'function') {
    presentLayer.requestFullscreen().catch(() => { /* Fullscreen is optional. */ });
  }
}
function exitPresentation() {
  if (!showing) return;
  showing = false;
  stopClock();
  presentLayer.hidden = true;
  document.body.classList.remove('presenting');
  if (document.fullscreenElement === presentLayer && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  $('present').focus();
}
function buildPrintDeck() {
  document.getElementById('print-deck')?.remove();
  const deck = document.createElement('div');
  deck.id = 'print-deck';
  deck.style.display = 'none';
  for (let i = 0; i < slides.length; i++) {
    const page = document.createElement('section');
    page.className = 'print-page';
    const body = document.createElement('div');
    body.className = 'slide-body';
    renderSlide(slides[i], body);
    const label = document.createElement('span');
    label.className = 'slide-number';
    label.textContent = (i + 1) + ' / ' + slides.length;
    page.append(body, label);
    deck.append(page);
  }
  document.body.append(deck);
}
function download(name, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

source.addEventListener('input', () => {
  deckRevision++;
  updateDeck();
  if (draftTimer !== null) clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 400);
});
source.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const start = source.selectionStart, end = source.selectionEnd;
  source.setRangeText('  ', start, end, 'end');
  source.dispatchEvent(new Event('input'));
});
$('theme').addEventListener('change', event => setTheme(event.target.value));
$('previous').addEventListener('click', () => changeSlide(-1));
$('next').addEventListener('click', () => changeSlide(1));
$('present').addEventListener('click', enterPresentation);
$('present-previous').addEventListener('click', () => changeSlide(-1));
$('present-next').addEventListener('click', () => changeSlide(1));
$('present-jump').addEventListener('change', () => {
  const target = Number($('present-jump').value);
  if (Number.isInteger(target) && target >= 1 && target <= slides.length) {
    selected = target - 1;
  }
  renderSelected();
});
$('exit').addEventListener('click', exitPresentation);
$('present-pause').addEventListener('click', toggleClock);
$('present-reset').addEventListener('click', resetClock);
document.addEventListener('fullscreenchange', () => {
  if (showing && document.fullscreenElement !== presentLayer) exitPresentation();
});
document.addEventListener('keydown', event => {
  if (!showing) return;
  if (event.key === 'Escape') { event.preventDefault(); exitPresentation(); }
  else if (event.target instanceof HTMLElement &&
           (event.target.matches('input, textarea, select') || event.target.isContentEditable)) return;
  else if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault(); toggleClock();
  } else if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault(); resetClock();
  }
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
    event.preventDefault(); changeSlide(1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault(); changeSlide(-1);
  } else if (event.key === 'Home') {
    event.preventDefault(); selected = 0; renderSelected();
  } else if (event.key === 'End') {
    event.preventDefault(); selected = slides.length - 1; renderSelected();
  }
});
$('new-deck').addEventListener('click', () => {
  if (!confirm('Create a blank deck? This will erase the current deck and replace its local browser autosave. Export your Markdown first if you need a backup.')) return;
  // Do not allow a pending autosave or file import to restore an older draft.
  if (draftTimer !== null) clearTimeout(draftTimer);
  draftTimer = null;
  importRequest++;
  deckRevision++;
  source.value = '';
  selected = 0;
  updateDeck();
  try {
    // An explicit empty value survives reload instead of falling back to
    // SAMPLE. No previous deck content is kept in this storage entry.
    localStorage.setItem(STORE_KEY, '');
    message('Blank deck created. The previous local autosave was replaced.');
  } catch {
    message('Blank deck created, but browser storage could not be cleared. An earlier saved deck may return on reload.', 'error');
  }
  source.focus();
});
$('example').addEventListener('click', () => {
  if (source.value.trim() && source.value !== SAMPLE &&
      !confirm('Replace the current deck with the example? Export your existing Markdown if needed.')) return;
  deckRevision++;
  source.value = SAMPLE;
  selected = 0;
  updateDeck();
  saveDraft();
});
$('import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const request = ++importRequest;
  const revision = deckRevision;
  if (file.size > MAX_SOURCE) {
    message('The file exceeds the 200 KB deck limit.', 'error');
    return;
  }
  try {
    const contents = await file.text();
    if (request !== importRequest) return;
    if (revision !== deckRevision) {
      message('The deck changed while reading the file. Import cancelled to preserve your edits.', 'error');
      return;
    }
    parseDeck(contents);
    if (source.value.trim() && source.value !== contents &&
        !confirm('Replace your current deck with this file?')) return;
    if (request !== importRequest || revision !== deckRevision) return;
    deckRevision++;
    source.value = contents;
    selected = 0;
    updateDeck();
    if (draftTimer !== null) clearTimeout(draftTimer);
    draftTimer = null;
    saveDraft();
  } catch (error) {
    if (request === importRequest) message('Import failed: ' + error.message, 'error');
  }
});
$('export').addEventListener('click', () => download('presentation.md', source.value, 'text/markdown;charset=utf-8'));
$('export-notes').addEventListener('click', () => {
  try {
    const contents = speakerNotesText(slides);
    download('speaker-notes.txt', contents, 'text/plain;charset=utf-8');
    message('Speaker notes exported. The file may contain private speaking material; store it carefully.');
  } catch (error) {
    message(error.message, 'error');
  }
});
$('print').addEventListener('click', () => {
  if (!slides.length) { message('Add a slide before printing.', 'error'); return; }
  buildPrintDeck();
  window.print();
});
window.addEventListener('beforeprint', () => { if (slides.length) buildPrintDeck(); });
window.addEventListener('afterprint', () => document.getElementById('print-deck')?.remove());

source.value = stored(STORE_KEY, SAMPLE);
setTheme(stored(THEME_KEY, 'light'));
updateDeck();
