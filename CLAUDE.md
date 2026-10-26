# azwad

Nadid Azwad's portfolio: a file tree that grows as a dithered plant. Peers first, then hiring teams, then clients. The repo is public: code is MIT, the work it shows is not. Vite + React 19 + TypeScript, three.js via `@react-three/fiber`, Tailwind v4. Hosted on Vercel, deployed from GitHub: a static Vite build, with `vercel.json` sending page paths to `index.html` so a case study's URL reloads.

## Map
- `src/app/App.tsx`: root component; renders the garden.
- `src/grove/`: the file tree as a plant, with no three.js. `createGrove` owns growth, open/close, the location (the open path) and the camera, including when panning is allowed and the ground the view never sinks below; scene and labels both read it. A paced `go('/', { whole, pace })` opens the whole plant a folder a turn (on the phone's one-sibling layout, as a tour).
- `src/portfolio/`: the content. `tree.ts` is the tree with each entry's caption and its desktop placement (hand-placed branch paths, world px, y down); `phone.json` places the same tree for a phone, by path; `layouts.ts` pairs each placement with where the words stand. `writing/` holds the Markdown (about, case studies); `media.ts` addresses media by tree path. Branches must stay out of the intro and the time (see the comment in `tree.ts`); `/__overview` (dev only) draws the desktop layout for placing it, and `/__overview/phone` edits the phone's and saves it to `phone.json`.
- `src/garden/`: the page: the plant, labels pinned to it, the masthead set in the world (name on the ground, intro, time), the contact folder, previews and case studies, the address (`address.ts`: only a case study gets a URL; reloading anywhere else starts the plant afresh), drag/scroll panning, viewport scale. `garden/case/` is the case-study page, a near copy of the reference's case template on white; `case/parse.ts` documents the Markdown shapes the case studies are written in (deliverables, threads, before/after, strips, numbers). Below 640 px (`viewport.narrow` in code, `max-sm:` in classes) it takes the phone layout; phone changes gate on that so the desktop stays as it is.
- `src/scene/`: everything three.js. `<Scene grove scale dpr />` draws the plant (lit tubes + instanced leaves) and runs the dither pass; it also steps the grove each frame, so labels and pixels move together. Lazy-loaded so three stays out of the main bundle.
- `src/sound/`: everything audible. `sound.play(cue)` and the welcome tune (on landing where the browser allows sound, else on the first touch; every load). `cues.ts` is the mix: files, levels, takes, gaps; every file is peaked at -1 dBFS, so levels change there, not by re-encoding. Sound is always on; films play with theirs. `garden/sounds.ts` hears the grove rather than clicks: a folder knocks open, its names climb the pentatonic as they sprout, a branch knocks shut, previews pop, case studies swish. While a paced `go` opens the plant (the intro's dithered "open"), `tune.ts` puts those same sounds in time and in chords (I–vi–IV–V at 132 BPM) and ends on a C chord.
- `src/meta/`: how the site presents itself outside itself: the site's name, address and description, the page head (title, link previews, icons, structured data), each case study's share card (`CASES`, kept in step with the tree by `pnpm test`), tab titles, sitemap, robots.txt and manifest. `vite.config.ts` writes the head into index.html and a page per case study into `dist/share/`, which `vercel.json` serves at the case study's address.
- `src/icons/`: pixel glyphs (folders, file kinds, the hello folder) on the dither grid. Drawn for this project; never use the reference's.
- `src/styles/theme.css`: design tokens (colours, type scale, easing, shadows) as a Tailwind `@theme`. The default Tailwind palette and text sizes are cleared, so use these tokens (`text-ink`, `text-copy`, `font-mondwest`) or arbitrary values.
- `src/styles/fonts.css` + `public/fonts/`: PP Neue Montreal (default sans), PP Mondwest (display), PP NeueBit. One weight each. The font files are git-ignored (Pangram's licence covers the site, not redistribution); `pnpm build` runs `scripts/fonts.mjs`, which pulls missing ones from the private `nadidazwad/garden-fonts` repo when `FONTS_TOKEN` is set (Vercel has it in its environment variables).
- `~/Projects/azwad-assets/` (outside the repo): the media pipeline. `tools/shoots/` films the live sites frame by frame, `tools/compose.py` adds the camera moves and pointer, `tools/publish.py` encodes everything into `public/media/` and writes the sizes to `media.json`. `tools/brand/icons.py` draws the favicon and app icons (a sphere in the blossoms' blues, dithered with the plant's Bayer matrix), and `tools/brand/og.mjs` the share cards into `public/og/` (start `pnpm dev` first). `tools/sounds/make.py` renders the sounds with earshot (its venv is `tools/earshot-src/.venv`) into `public/sound/`, as Opus and MP3.
- `~/Projects/azwad-reference/` (outside the repo): finnolivertaylor.com's typography, spacing, layouts, icons and screenshots (its README is the index), plus the plant concept video. Reference only: never ship or commit any of it.

## Commands
- `pnpm dev`: dev server
- `pnpm build`: `tsc -b` + `vite build`
- `pnpm lint`: oxlint
- `pnpm test`: vitest

## Rules
- Typography and layout follow the reference site's values; the site's behaviour follows Azwad's own brief.
- Emphasis comes from colour (grey `body` text with `ink`/`accent` phrases), not weight. Each font has only one weight.
- The plant, icons and labels share one pixel grid (`CELL` in `src/grove/view.ts`). Dither inside text (`dither-fill`) is the one exception: a cell there is one CSS px in whole device px, because a plant cell is a third of a letter. The dither pattern is locked to the world and the picture slides by whole device pixels; don't snap the camera to cells (pans stutter) or dither in screen space (pans shimmer).
- Media (stills, films) lives in `public/media/`, sounds in `public/sound/`, both committed; Vercel serves them with the site. Every re-encode stays in git history, so publish sparingly and keep films under ~25 MB.
- Adding, renaming or removing an entry in `tree.ts` means placing it in `phone.json` too (`pnpm test` names what's missing).
- Everything on the site is in English, with no Bangla script; Bangla titles are romanised with an English gloss.
- No tilted or rotated text.
- Commit messages end with `Co-Skimmed-By: Nadid Azwad`, never a Claude co-author trailer.
