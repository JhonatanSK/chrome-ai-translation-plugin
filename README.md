# Chrome AI Translation Assistant

Chrome extension (MV3) that detects form fields, pairs source/target inputs, and translates using pluggable AI providers. Works on regular inputs, textareas, and rich-text editors (`contenteditable`).

## Features

- Manifest V3 architecture (content script + service worker + React UI)
- Field detection: inputs, textareas, `contenteditable`, `role="textbox"`
- Metadata extraction: label, placeholder, name/id, position
- Auto pairing with local heuristics (no DOM decisions by AI)
- Manual pairing with in-page overlay UI
- AI translation via Google Gemini or custom endpoint
- Optional AI pairing suggestions (uses metadata only)
- Safe value injection for React-controlled inputs
- Fallback copy-to-clipboard when writing fails

## Project Structure

```
src/
  core/         # heuristics, types, language detection
  providers/    # AI providers (google/custom)
  content/      # content script logic + overlay UI
  background/   # service worker, storage, batching
  ui/           # popup + options (React)
public/
  manifest.json
```

## Requirements

- Node.js 18+
- Chrome (MV3 compatible)

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

This generates a `dist/` folder containing:
- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `options.html`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder

## Configure

1. Open the extension **Options** page
2. Add your API key and choose a model (default: `gemini-2.5-flash`)
3. (Optional) enable **AI Pairing Suggestions**

## Test

Suggested pages:
- https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit
- https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_textarea
- https://ckeditor.com/ckeditor-5/demo/

### Basic flow

1. Open a page with form fields
2. Open the extension popup
3. Click **Detect Fields**
4. (Optional) click **Manual Pair** and select two fields
5. Click **Translate**

## Notes

- Content script never calls external APIs.
- API keys are stored in `chrome.storage.local`.
- AI never receives DOM; only field metadata.

## Development

```bash
npm run dev
```

Vite serves the UI locally for quick iteration, but for Chrome testing you must run `npm run build` and reload the `dist` folder.
