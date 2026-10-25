import { aspect } from '../../portfolio'
import type { Media } from './parse.ts'

export const isFilm = (media: Media) => /\.mp4$/i.test(media.src)

/** Width over height, from `media.json`. */
export const ratio = (media: Media) => aspect(media.src)
