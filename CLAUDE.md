# azwad

Nadid Azwad's portfolio: a file tree that grows as a dithered plant. Peers first, then hiring teams, then clients. The repo is public: code is MIT, the work it shows is not. Vite + React 19 + TypeScript, three.js via `@react-three/fiber` + `@react-three/drei`, Tailwind v4. Hosted on Vercel (static Vite build, no config needed yet).

## Map
- `src/app/App.tsx`: root component; renders the garden.
- `src/grove/`: the file tree as a plant, with no three.js. `documents.ts` is the portfolio's tree (placeholder names) and its hand-placed branch paths (world px, y down). `createGrove` owns growth, open/close and the camera, including when panning is allowed; scene and labels both read it.
- `src/garden/`: the page: the plant filling it from the left edge, labels pinned to it, the masthead and footer, drag/scroll panning, viewport scale.
- `src/scene/`: everything three.js. `<Scene grove scale dpr />` draws the plant (lit tubes + instanced leaves) and runs the dither pass; it also steps the grove each frame, so labels and pixels move together. Lazy-loaded so three stays out of the main bundle.
- `src/icons/`: pixel glyphs (folder, open folder, documents) on the dither grid.
- `src/styles/theme.css`: design tokens (colours, type scale, easing, shadows) as a Tailwind `@theme`. The default Tailwind palette and text sizes are cleared, so use these tokens (`text-ink`, `text-copy`, `font-mondwest`) or arbitrary values.
- `src/styles/fonts.css` + `public/fonts/`: PP Neue Montreal (default sans), PP Mondwest (display), PP NeueBit. One weight each. The font files are git-ignored (Pangram's licence covers the site, not redistribution); builds pull them in.
- `~/Projects/azwad-reference/` (outside the repo): finnolivertaylor.com's typography, spacing, layouts, icons and screenshots (its README is the index), plus the plant concept video. Reference only: never ship or commit any of it.

## Commands
- `pnpm dev`: dev server
- `pnpm build`: `tsc -b` + `vite build`
- `pnpm lint`: oxlint
- `pnpm test`: vitest

## Rules
- Typography and layout follow the reference site's values; the site's behaviour follows Azwad's own brief.
- Emphasis comes from colour (grey `body` text with `ink`/`accent` phrases), not weight. Each font has only one weight.
- The plant, icons and labels share one pixel grid (`CELL` in `src/grove/view.ts`). The dither pattern is locked to the world and the picture slides by whole device pixels; don't snap the camera to cells (pans stutter) or dither in screen space (pans shimmer).
- Media (stills, films) never goes in git: it lives in R2.
- Bangla appears only where it carries meaning (film titles, a line in about.txt); the name is always English.
