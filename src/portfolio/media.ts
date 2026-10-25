import sizes from './media.json'

// Media is named by its path in the tree: `/work/quickhajj/home.png` lives at
// `public/media/work/quickhajj/home.avif`, filled by ~/Projects/azwad-assets and
// served with the site (VITE_MEDIA_BASE can point it elsewhere). Case-study images
// are named the same way, by a path of their own. `media.json` holds each
// item's size, so frames can be laid out before anything loads.

const BASE = (import.meta.env.VITE_MEDIA_BASE as string | undefined) ?? '/media/'

const known: Record<string, number[]> = sizes

/** `/work/quickhajj/home.png` → `work/quickhajj/home` */
export function mediaKey(path: string) {
  return path.replace(/^\/+/, '').replace(/\.[a-z0-9]+$/i, '')
}

export function stillUrl(path: string) {
  return `${BASE}${mediaKey(path)}.avif`
}

export function filmUrl(path: string) {
  return `${BASE}${mediaKey(path)}.mp4`
}

export function posterUrl(path: string) {
  return `${BASE}${mediaKey(path)}.poster.avif`
}

/** Width over height, or a landscape guess until the media has been encoded. */
export function aspect(path: string) {
  const size = known[mediaKey(path)]
  return size ? size[0] / size[1] : 16 / 10
}
