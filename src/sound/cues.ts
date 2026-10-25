// What each cue sounds like and how loud. The files are made by earshot in
// ~/Projects/azwad-assets/tools/sounds/make.py, every one peaked at -1 dBFS,
// so the mix is set here and a level change never needs a re-encode.

/** The sprouting notes, low to high: C major pentatonic, like the welcome tune. */
const PENTATONIC = ['G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6']

export interface CueSpec {
  /** Takes, picked at random so a repeat never sounds stamped; or, for a tuned cue, one per step. */
  files: string[]
  gain: number
  /** A second play closer than this (ms) to the last is dropped, or for a tuned cue, queued behind it. */
  gap?: number
  /** Played by step (`play(cue, { step })`), not at random. */
  tuned?: boolean
  /** Random detune either side, in cents, so takes of one sound never quite match. */
  wobble?: number
}

export const CUES = {
  /** A folder opening, here or in the hello corner. */
  open: { files: ['open-1', 'open-2'], gain: 0.42, gap: 70, wobble: 40 },
  /** A branch snapping back. */
  close: { files: ['close-1', 'close-2'], gain: 0.36, gap: 120, wobble: 40 },
  /** A name growing in along a branch; each one a step higher. */
  sprout: { files: PENTATONIC.map((note) => `sprout-${note}`), gain: 0.16, gap: 55, tuned: true },
  /** The pointer passing over something that opens. */
  hover: { files: ['hover-1', 'hover-2', 'hover-3'], gain: 0.07, gap: 60, wobble: 80 },
  /** A preview growing out of its file, and back in. */
  peek: { files: ['peek'], gain: 0.34, gap: 80, wobble: 30 },
  unpeek: { files: ['unpeek'], gain: 0.24, gap: 80, wobble: 30 },
  /** A case study laid over the plant, and lifted off. */
  page: { files: ['page'], gain: 0.2, gap: 200, wobble: 25 },
  pageOut: { files: ['page-out'], gain: 0.16, gap: 200, wobble: 25 },
  /** Off to another site. */
  link: { files: ['link'], gain: 0.2, gap: 300 },
  switch: { files: ['switch'], gain: 0.22, gap: 60, wobble: 30 },
  unfold: { files: ['unfold'], gain: 0.26, gap: 60, wobble: 30 },
  fold: { files: ['fold'], gain: 0.24, gap: 60, wobble: 30 },
  toggleOn: { files: ['toggle-on'], gain: 0.24, gap: 60 },
  toggleOff: { files: ['toggle-off'], gain: 0.24, gap: 60 },
  /** One piece to the next in the viewer. */
  step: { files: ['step'], gain: 0.12, gap: 90, wobble: 60 },
  /** The before/after slider passing a tenth. */
  detent: { files: ['detent'], gain: 0.07, gap: 35, wobble: 50 },
  /** A thrown view gliding on; the throw sets how loud. */
  fling: { files: ['fling'], gain: 0.16, gap: 250, wobble: 60 },
} satisfies Record<string, CueSpec>

export type Cue = keyof typeof CUES

/** The welcome tune, played as the page lands, or on the first touch where the browser holds sound back till then. */
export const WELCOME = { file: 'welcome', gain: 0.5 }
