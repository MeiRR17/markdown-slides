# Markdown Slides

Write a presentation in Markdown, preview it in a browser, and switch to distraction-free presentation mode. No accounts, build process, backend, dependencies, or cloud storage.

## Start

Serve the repository root with any static web server. For example:

    python3 -m http.server 8000

Open http://localhost:8000. A local HTTP server is recommended for native ES modules; GitHub Pages or another static host also works.

The editor starts with an example deck unless you have already saved a draft in the browser.

## Workflow

1. Write plain Markdown in the left editor. Separate slides with a line containing exactly three hyphens.
2. Select a slide in the outline. The preview updates immediately.
3. Choose Clean light, Midnight, or Warm sand.
4. Press **Present deck** for full-screen presentation mode. Navigate with Right/Down/Space (next) or Left/Up (previous); Home/End jump to the beginning/end; Escape exits. The presentation toolbar includes a numeric **Go to slide** input for jumping to a specific slide without stepping through intermediate slides. Typing a slide number does not trigger presentation keyboard shortcuts. The presentation toolbar displays a live elapsed-time clock, pause/resume button and reset button. Press **P** to pause/resume or **R** to reset the timer. A progress bar indicates slide position. The timer resets when you start a new presentation session.
5. Export your deck as a .md file. Use **Print / PDF** to print all slides or save a PDF using your browser print dialog.
6. Use **New blank deck** to clear the current editor and replace the browser's saved draft with an empty value. This requires explicit confirmation and cancels pending imports/autosaves. Export a backup before clearing; the action cannot be undone.

## Supported Markdown

- Headings using one to four leading hash symbols; paragraphs
- Bulleted lists and numbered lists
- Bold and emphasis, inline code, backtick or tilde fenced code blocks (three or more matching markers; a closing fence must be at least as long as its opening fence)
- Block quotes, horizontal rules with three asterisks or underscores
- Standard hyperlinks and external image references
- A separate line of three hyphens to create the next slide (not inside a code fence, including longer four-or-more-backtick and tilde fences)
- Speaker notes after a standalone line with three question marks outside code fences; notes appear in the editor but are never included in the slide presentation or print output
- Presentation progress and timer are temporary, in-memory UI state; nothing about elapsed presenting time is saved or transmitted

HTML markup is **not** interpreted. The renderer constructs DOM elements and text nodes, avoiding HTML injection. Inline Markdown is intentionally a small subset, not full CommonMark: nested inline markup, complex tables, and nested lists are not currently supported.

## Privacy

Deck text stays on your device and auto-saves to localStorage in the current browser profile. An empty new deck is stored as an empty string, so reloading does not restore the built-in sample. If browser storage is blocked, the blank editor still opens but the UI warns that a previously saved draft may reappear on reload. There is no analytics, server storage, or account service. Export .md files for backup and device transfer.

**External images and links:** A Markdown image using an http(s) address causes the browser to request that URL from the image host; links navigate to their destination when clicked. Avoid external images when working with confidential decks.

## Limits and status

Input is limited to 200,000 characters and 120 slides. The application does not require third-party libraries. This version is implementation-only and is awaiting the owner's consolidated testing cycle.

## Source

- index.html — responsive editor, live preview, presentation controls
- styles.css — clean, midnight, warm sand and print themes
- src/markdown.js — Markdown slide parser, notes parser and safe DOM renderer
- app.js — local draft persistence, slide navigation, presenter clock, import/export and printing
- LICENSE — MIT

## Author

Built by Meir Dvir · https://github.com/MeiRR17

Local `.md` imports are validated before replacing the deck, require confirmation if replacing content, and ignore stale file reads after edits or newer file selections.
