# vslide-cn-react · 微思文稿

React + TypeScript rewrite of the interactive slide editor, faithful to the compact UX of the Vue blueprint [`vslide-vue`](https://github.com/shalom-lab/vslide-vue).

> This repo is the React greenfield. Do **not** confuse with `vslide-cn` (abandoned Vue scaffold) or `vslide-vue` (read-only blueprint).

## Features

- **演示文稿** path: multi-slide edit ↔ play
- 18×18 **react-grid-layout** canvas (drag / resize / overlap + 置顶/置底)
- **Shared `AtomRenderer`** for edit · play · thumbs (no dual drift)
- **Atom registry** (`src/atoms/registry.ts`) for text / chart / table / image / **custom-html**
- **Markdown (`text-md`)** with KaTeX math (`$…$` / `$$…$$`) and prose styles; **DOMPurify** before render
- **Safe HTML (`custom-html`)** — static markup only; scripts / event handlers / `javascript:` stripped
- Charts: line · bar · **stack-bar** · **hor-bar** · pie · **scatter** — **place-first** (拖框再选图) via insert drawer
- Undo / redo (`Ctrl+Z` / `Ctrl+Y`) for deck mutations
- Compact Chinese chrome; sample deck (~6 slides)
- Play: `←` `→` / Space / Esc→edit

## Run

```bash
npm install
npm run dev -- --host 0.0.0.0
# → http://localhost:5173
```

```bash
npm run build
```

Local dev uses Vite `base: '/'`. CI sets `GITHUB_ACTIONS` so production builds use `base: '/vslide-cn-react/'` for the GitHub Pages project site.

## GitHub Pages

**Live URL:** https://shalom-lab.github.io/vslide-cn-react/

CI/CD: every push to `main` runs [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) (`npm ci` → `npm run build` → upload Pages artifact → deploy). SPA routes (`/edit`, `/play`) work on refresh via a `404.html` copy of `index.html` (GitHub Pages serves that for unknown paths).

### One-time enable (if not already on)

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run the **Deploy GitHub Pages** workflow if the first deploy waited on Pages being enabled (`Actions` → workflow → **Re-run**)

Private repos need a plan that includes GitHub Pages (Pro / Team / Enterprise). Site visibility follows your Pages visibility setting.

## Blueprint notes

See [docs/blueprint-notes.md](./docs/blueprint-notes.md).

## Stable JSON (Agent skills)

Deck / atom field names stay aligned with vslide-vue (`fileType: vslideFile`, `atomContent.atomName`, `detail.sheetData` + `nr`/`nc`, …). Prefer extending the registry over inventing parallel shapes.

### Safe HTML atoms

`text-md` and `custom-html` always run HTML through `src/utils/sanitizeHtml.ts` (DOMPurify) before `dangerouslySetInnerHTML`. They **never execute JavaScript** (no `<script>`, no `on*` handlers, no `javascript:` URLs, no iframes). Insert via TopBar **文本** (Markdown) or **HTML**.

## Deferred

CloudBase login/share · Handsontable · full animation timeline · full chart zoo · Electron · richer 模板图表 / 我的图表 galleries.
