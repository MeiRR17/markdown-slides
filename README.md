# Markdown Slides

Write a presentation in Markdown, preview it in a browser, and switch to distraction-free presentation mode. No accounts, build process, backend, dependencies, or cloud storage.

## Start

Serve the repository root with any static web server. For example:

    python3 -m http.server 8000

Open http://localhost:8000. A local HTTP server is recommended for native ES modules; GitHub Pages or another static host also works.

The editor starts with an example deck unless you have already saved a draft in the browser.

## Workflow

1. Write plain Markdown in the left editor. Separate slides with a line containing exactly three hyphens.
2. Select a slide in the outline. The preview updates immediately. For longer decks, use **Find a slide by title** to narrow the outline without modifying the Markdown or changing the current slide. Combine this with the **Notes only** checkbox to show only slides whose `???` speaker-note section contains non-whitespace text; the outline also displays the number of slides with notes for preparation planning. Both filters act only on the editor outline, retain the original slide numbers, and leave the selected slide and presentation sequence untouched. **Clear filters** restores all titles. The search applies only to slide titles, not bodies or private speaker notes; even with Notes only active, the outline never reveals the note contents.
3. Choose Clean light, Midnight, or Warm sand.
4. Press **Present deck** for full-screen presentation mode. Navigate with Right/Down/Space (next) or Left/Up (previous); Home/End jump to the beginning/end; Escape exits. The presentation toolbar includes a numeric **Go to slide** input for jumping to a specific slide without stepping through intermediate slides. Typing a slide number does not trigger presentation keyboard shortcuts. The presentation toolbar displays a live elapsed-time clock, pause/resume button and reset button. Press **P** to pause/resume or **R** to reset the timer. Press **B** (or the **Black screen** button) to temporarily hide the projected slide on a black background; press again to reveal it. For presenter-led sessions, **Show notes** (or **N**) opens the current slide's speaker notes in a separate panel over the presentation; it is hidden by default, disappears during blackout, and closes when you exit. The notes panel is visible on the same display as the slides, so do not enable it while projecting to an audience unless the presenter has a separate/private display. Keyboard auto-repeat does not flicker the screen. The slide content/number are covered but the toolbar, slide navigation and running timer remain available, and you can advance slides while the screen stays black. Exiting or starting a presentation resets the blackout state. A progress bar indicates slide position. The timer resets when you start a new presentation session.
5. Export your deck as a .md file. Use **Slide outline (.txt)** for a numbered title-only agenda that omits slide bodies and private speaker notes; titles may still be sensitive. Use **Speaker notes (.txt)** to download a separate plaintext preparation sheet containing only slides with notes, their original slide numbers and titles. The notes file does not contain slide bodies or image URLs, and the export is disabled for a deck without notes. Use **Print / PDF** to print all slides or save a PDF using your browser print dialog.
6. Use **New blank deck** to clear the current editor and replace the browser's saved draft with an empty value. This requires explicit confirmation and cancels pending imports/autosaves. Export a backup before clearing; the action cannot be undone.

## Supported Markdown

- Headings using one to four leading hash symbols; paragraphs
- Bulleted lists and numbered lists
- Bold and emphasis, inline code, backtick or tilde fenced code blocks (three or more matching markers; a closing fence must be at least as long as its opening fence)
- Block quotes, horizontal rules with three asterisks or underscores
- Standard hyperlinks and external image references
- A separate line of three hyphens to create the next slide (not inside a code fence, including longer four-or-more-backtick and tilde fences). Slide titles are derived only from headings outside fenced code, so example code does not mislabel an outline entry
- Speaker notes after a standalone line with three question marks outside code fences; notes appear in the editor but are never included in the slide presentation or print output. A separate on-demand plaintext notes export retains original slide numbers while omitting slides that have no notes
- Presentation progress, timer, optional presenter blackout and on-screen speaker-note panel, slide-title search and the Notes only outline filter are temporary, in-memory UI state; nothing about elapsed presenting time, blackout use, search terms or filter choices is saved or transmitted

HTML markup is **not** interpreted. The renderer constructs DOM elements and text nodes, avoiding HTML injection. Inline Markdown is intentionally a small subset, not full CommonMark: nested inline markup, complex tables, and nested lists are not currently supported.

## Privacy

Deck text stays on your device and auto-saves to localStorage in the current browser profile. **Autosave now keeps the last valid draft:** if editing produces an unsupported deck (over 200,000 characters or over 120 slides), the raw editor text remains available to export manually but does not replace the last successfully saved browser draft. An explicit warning explains that the current changes have not been autosaved; editing back into supported limits resumes saving. This avoids silently replacing a recoverable deck with content the presenter cannot render. The intentionally empty **New blank deck** action remains a supported explicit replacement. Explicitly exported speaker-note files may contain confidential speaking material; review and protect them before sharing. An empty new deck is stored as an empty string, so reloading does not restore the built-in sample. If browser storage is blocked, the blank editor still opens but the UI warns that a previously saved draft may reappear on reload. There is no analytics, server storage, or account service. Export .md files for backup and device transfer.

**External images and links:** A Markdown image using an http(s) address causes the browser to request that URL from the image host; links navigate to their destination when clicked. Avoid external images when working with confidential decks.

## Limits and status

Input is limited to 200,000 characters and 120 slides. The application does not require third-party libraries. This version is implementation-only and is awaiting the owner's consolidated testing cycle.

## Source

- index.html — responsive editor, live preview, presentation controls
- styles.css — clean, midnight, warm sand and print themes
- src/markdown.js — Markdown slide parser, fenced-code-aware titles, title-only outline and note exports, safe DOM renderer
- app.js — local draft persistence, title search and speaker-notes-only outline filtering, numbered title-only export, slide navigation, presenter clock, import/export and printing
- LICENSE — MIT

## Author

Built by Meir Dvir · https://github.com/MeiRR17

Local `.md` imports are validated before replacing the deck, require confirmation if replacing content, and ignore stale file reads after edits or newer file selections. Import reads at most **200 KB of file bytes** and decodes UTF-8 strictly; malformed encoding is rejected instead of silently replacing characters that could corrupt titles, code examples or speaker notes. The byte limit is checked before and after reading, while the separate 200,000-character/120-slide parser limits still apply. Rejected imports leave the current deck and its autosave untouched.
