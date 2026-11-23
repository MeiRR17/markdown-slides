/**
 * Minimal Markdown parser for local presentation decks.
 * Source is always rendered as DOM text and never interpreted as raw HTML.
 */
export const MAX_SOURCE = 200_000;
export const MAX_SLIDES = 120;

// Track marker and fence length: shorter delimiters in code examples must
// not split a slide or prematurely terminate speaker notes.
function openingFence(line) {
  const match = /^ {0,3}(\x60{3,}|~{3,})(.*)$/.exec(line);
  if (!match || (match[1].charCodeAt(0) === 96 && match[2].includes('\x60'))) return null;
  return {
    marker: match[1][0],
    length: match[1].length,
    language: match[2].trim().split(/\s+/)[0].slice(0, 24),
  };
}
function closingFence(line, opening) {
  const match = /^ {0,3}(\x60+|~+)[ \t]*$/.exec(line);
  return Boolean(match && match[1][0] === opening.marker &&
    match[1].length >= opening.length);
}
const divider = line => /^---\s*$/.test(line);
const heading = line => /^(#{1,4})\s+(.+)$/.exec(line);
const listLine = line => /^(\s*)([-*+]|\d+\.)\s+(.+)$/.exec(line);
const quoteLine = line => /^\s*>\s?/.test(line);

// Headings shown in the outline must be actual slide content: Markdown
// examples inside code fences should not become slide titles.
function readTitle(lines, index) {
  let fence = null;
  for (const line of lines) {
    if (fence) {
      if (closingFence(line, fence)) fence = null;
      continue;
    }
    fence = openingFence(line);
    if (fence) continue;
    const match = heading(line);
    if (match) return match[2].replace(/[\x60*_]/g, '').slice(0, 90);
  }
  return 'Slide ' + (index + 1);
}

function separateNotes(lines) {
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    if (fence) {
      if (closingFence(lines[i], fence)) fence = null;
      continue;
    }
    fence = openingFence(lines[i]);
    if (!fence && lines[i].trim() === '???') {
      return { content: lines.slice(0, i), notes: lines.slice(i + 1).join('\n').trim() };
    }
  }
  return { content: lines, notes: '' };
}

/** Split slides on divider lines outside code fences; support speaker notes. */
export function parseDeck(source) {
  if (typeof source !== 'string') throw new TypeError('Slide source must be text.');
  if (source.length > MAX_SOURCE) throw new RangeError('Slide deck exceeds 200,000 characters.');
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const slides = [];
  let block = [], fence = null;
  function flush() {
    if (!block.some(line => line.trim())) { block = []; return; }
    const { content, notes } = separateNotes(block);
    slides.push({ content, notes, title: readTitle(content, slides.length) });
    if (slides.length > MAX_SLIDES) throw new RangeError('Slide deck exceeds 120 slides.');
    block = [];
  }
  for (const line of lines) {
    if (!fence && divider(line)) { flush(); continue; }
    block.push(line);
    if (fence) {
      if (closingFence(line, fence)) fence = null;
    } else fence = openingFence(line);
  }
  flush();
  return slides;
}

/**
 * Export an explicit speaker-only note sheet, without slide bodies or images.
 * This is plain text, not Markdown rendering. Slides with no notes are omitted,
 * but original slide numbers are preserved for reliable cross-reference.
 */
export function speakerNotesText(slides) {
  if (!Array.isArray(slides) || slides.length > MAX_SLIDES) {
    throw new TypeError('Expected a parsed deck of up to 120 slides.');
  }
  const sections = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (!slide || typeof slide.title !== 'string' || typeof slide.notes !== 'string') {
      throw new TypeError('Invalid slide speaker notes.');
    }
    const notes = slide.notes.trim();
    if (!notes) continue;
    sections.push('Slide ' + (i + 1) + ' — ' + slide.title.replace(/[\r\n]+/g, ' ') +
      '\n' + '-'.repeat(32) + '\n' + notes);
  }
  if (!sections.length) throw new RangeError('No speaker notes to export.');
  return 'Speaker notes — exported locally\n' +
    'Deck slides: ' + slides.length + ' · Slides with notes: ' + sections.length +
    '\n\n' + sections.join('\n\n') + '\n';
}

/**
 * Export numbered slide headings for a compact preparation agenda.
 * Deliberately excludes slide bodies and all speaker notes. Titles themselves
 * may be sensitive and are flattened to one line per slide.
 */
export function slideOutlineText(slides) {
  if (!Array.isArray(slides) || slides.length < 1 || slides.length > MAX_SLIDES) {
    throw new RangeError('Expected a nonempty deck of up to 120 slides.');
  }
  const lines = ['Slide outline', 'Total slides: ' + slides.length, ''];
  for (let index = 0; index < slides.length; index++) {
    const slide = slides[index];
    if (!slide || typeof slide.title !== 'string' || slide.title.length > 90) {
      throw new TypeError('A slide title is missing or outside the supported range.');
    }
    const title = slide.title.replace(/[\r\n\u2028\u2029]+/g, ' ').trim();
    lines.push((index + 1) + '. ' + (title || 'Slide ' + (index + 1)));
  }
  return lines.join('\n') + '\n';
}

const element = (tag, cls = '') => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};
const addText = (parent, value) => { parent.append(document.createTextNode(value)); };
function safeHref(raw) {
  try {
    const url = new URL(raw, location.href);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

/** Render bold, emphasis, inline code, links and images without parsing HTML. */
export function appendInline(parent, value) {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\x60([^\x60\n]+)\x60/g;
  let position = 0, match;
  while ((match = pattern.exec(value))) {
    addText(parent, value.slice(position, match.index));
    if (match[1] !== undefined) {
      const href = safeHref(match[2]);
      if (href && !href.startsWith('mailto:')) {
        const image = element('img', 'slide-image');
        image.src = href;
        image.alt = match[1];
        image.loading = 'lazy';
        parent.append(image);
      } else addText(parent, match[0]);
    } else if (match[3] !== undefined) {
      const href = safeHref(match[4]);
      if (href) {
        const anchor = element('a');
        anchor.href = href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = match[3];
        parent.append(anchor);
      } else addText(parent, match[0]);
    } else if (match[5] !== undefined) {
      const strong = element('strong');
      addText(strong, match[5]); parent.append(strong);
    } else if (match[6] !== undefined) {
      const em = element('em');
      addText(em, match[6]); parent.append(em);
    } else {
      const code = element('code');
      code.textContent = match[7]; parent.append(code);
    }
    position = pattern.lastIndex;
  }
  addText(parent, value.slice(position));
}
const isBlock = line => !line.trim() || openingFence(line) || heading(line) ||
  listLine(line) || quoteLine(line) || /^\s*(?:\*\*\*|___)\s*$/.test(line);

/** Render one slide from the supported Markdown subset into a target element. */
export function renderSlide(slide, target) {
  target.replaceChildren();
  const lines = slide.content;
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = openingFence(line);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !closingFence(lines[i], fence)) body.push(lines[i++]);
      if (i < lines.length) i++;
      const pre = element('pre');
      const code = element('code');
      if (fence.language) code.dataset.language = fence.language;
      code.textContent = body.join('\n');
      pre.append(code); target.append(pre);
      continue;
    }
    const h = heading(line);
    if (h) {
      const node = element('h' + h[1].length);
      appendInline(node, h[2]);
      target.append(node); i++; continue;
    }
    if (/^\s*(?:\*\*\*|___)\s*$/.test(line)) { target.append(element('hr')); i++; continue; }
    if (quoteLine(line)) {
      const quote = element('blockquote');
      const items = [];
      while (i < lines.length && quoteLine(lines[i])) {
        items.push(lines[i++].replace(/^\s*>\s?/, ''));
      }
      appendInline(quote, items.join(' '));
      target.append(quote); continue;
    }
    const list = listLine(line);
    if (list) {
      const ordered = /^\d/.test(list[2]);
      const container = element(ordered ? 'ol' : 'ul');
      while (i < lines.length) {
        const item = listLine(lines[i]);
        if (!item || /^\d/.test(item[2]) !== ordered) break;
        const li = element('li');
        appendInline(li, item[3]);
        container.append(li);
        i++;
      }
      target.append(container);
      continue;
    }
    const parts = [line.trim()];
    i++;
    while (i < lines.length && !isBlock(lines[i])) parts.push(lines[i++].trim());
    const p = element('p');
    appendInline(p, parts.join(' '));
    target.append(p);
  }
  if (!target.children.length) {
    const placeholder = element('p', 'empty-slide');
    placeholder.textContent = 'Empty slide';
    target.append(placeholder);
  }
}
