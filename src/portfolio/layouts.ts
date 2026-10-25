import type { Bounds, FolderSpec } from '../grove'
import type { Entry } from './entries.ts'
import { place, type Placements } from './place.ts'
import phoneGeometry from './phone.json'
import { GROUND, INTRO, portfolio, TIME } from './tree.ts'

/**
 * One way of laying the portfolio out: where everything grows and where the
 * words stand. A desktop and a phone each get their own, drawn by hand for
 * their shape; the files, folders and captions are the same in both.
 */
export interface Layout {
  /** The tree with everything placed: world px, y down. */
  tree: FolderSpec<Entry>
  /** World y of the ground the plant and the name stand on. */
  ground: number
  /** The view it's drawn for, in world px: the screen scales to fit it, within limits. */
  frame: { width: number; height: number; minScale: number; maxScale: number }
  /** The plant fits the width of the view, so the view only moves up and down. */
  fitWidth: boolean
  /** World px the view can rise above the plant: room for the small name pinned at the top. */
  headroom?: number
  /** Opening a folder closes its open siblings, so they can grow into the same room. */
  exclusive: boolean
  masthead: Masthead
}

interface Masthead {
  /** From its left edge to the end of its longest line, and from the tops of its letters to the ground. */
  name: { box: Bounds; size: number; stacked: boolean }
  /** Where the intro and the time sit, with their type; branches stay out of both. */
  intro: Words
  time: Words
}

interface Words {
  box: Bounds
  size: number
  leading: number
}

const NAME_SIZE = 212

/** The opening view spans x -432 to 848; branches cross the name, which tucks itself away while they do. */
export const desktop: Layout = {
  tree: portfolio,
  ground: GROUND,
  frame: { width: 1280, height: 800, minScale: 0.85, maxScale: 1.3 },
  fitWidth: false,
  exclusive: false,
  masthead: {
    name: { box: { minX: -404, maxX: 690, minY: GROUND - 0.75 * NAME_SIZE, maxY: GROUND }, size: NAME_SIZE, stacked: false },
    intro: { box: INTRO, size: 16, leading: 22 },
    time: { box: TIME, size: 13, leading: 17 },
  },
}

const PHONE_NAME = 80

/**
 * Drawn for a portrait phone: x 0 to 420, standing on the ground at y 0. The
 * name, the intro and the time stack up from the ground, and the plant enters
 * from the left above them and climbs. Branches only ever grow upward, into
 * sky nothing else uses, so they never cross words. Taller screens show more
 * sky. The geometry is in `phone.json`, by path, so `/__overview/phone` can
 * edit it.
 */
export const phone: Layout = {
  tree: place(portfolio, phoneGeometry as unknown as Placements),
  ground: 0,
  frame: { width: 420, height: 700, minScale: 0.6, maxScale: 1.3 },
  fitWidth: true,
  headroom: 110,
  exclusive: true,
  masthead: {
    // "Azwad", the longer line, stops short of the hello folder in the corner.
    name: { box: { minX: 28, maxX: 28 + 2.74 * PHONE_NAME, minY: -1.59 * PHONE_NAME, maxY: 0 }, size: PHONE_NAME, stacked: true },
    intro: { box: { minX: 28, maxX: 376, minY: -300, maxY: -174 }, size: 14.5, leading: 21 },
    time: { box: { minX: 28, maxX: 140, minY: -332, maxY: -315 }, size: 13, leading: 17 },
  },
}
