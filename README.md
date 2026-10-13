# vslide-cn-react · 微思文稿

React + TypeScript rewrite of the interactive slide editor, faithful to the compact UX of the Vue blueprint [`vslide-vue`](https://github.com/shalom-lab/vslide-vue).

> This repo is the React greenfield. Do **not** confuse with `vslide-cn` (abandoned Vue scaffold) or `vslide-vue` (read-only blueprint).

## Features (v1)

- **演示文稿** path: multi-slide edit ↔ play
- 18×18 **react-grid-layout** canvas (drag / resize)
- Atoms: Markdown/title text · line/bar/pie (ECharts) · table · image
- Compact Chinese chrome (toolbar · top bar · slide list · property panel)
- Sample deck (~5 slides)
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

## Blueprint notes

See [docs/blueprint-notes.md](./docs/blueprint-notes.md).

## Deferred

CloudBase login/share · Handsontable · full animation timeline · full chart zoo · Electron · 模板图表 / 我的图表 galleries.
