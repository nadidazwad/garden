import { PENTATONIC, type Cue } from './cues.ts'
import type { PlayOptions } from './sound.ts'

/** The tune's beat (s): 132 to the minute. */
export const BEAT = 60 / 132
const BAR = 4 * BEAT
/** Names land on the sixteenths. */
const SLOT = BEAT / 4
/**
 * The tune runs this far (s) behind the plant, so a sound that arrives with a
 * frame a little after its beat can still be put right on it. A knock any later
 * than that moves the beat to meet it.
 */
const LEAD = 0.03
/** A name that would wait longer than this (s) for a free sixteenth is left out. */
const WAIT = 0.4
/** The last chord is spread from low to high, this far apart (s). */
const ROLL = 0.06

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const midi = (note: string) => 12 * (Number(note.slice(1)) + 1) + SEMITONE[note[0]]
const NOTES = PENTATONIC.map(midi)

/** I–vi–IV–V in C, a bar each, round again until it goes home. Each chord low to high, G4 to C6, as MIDI notes. */
const CHORDS = [
  [67, 72, 76, 79, 84], // C: G C E G C
  [69, 72, 76, 81, 84], // Am: A C E A C
  [69, 72, 77, 81, 84], // F: A C F A C
  [67, 71, 74, 79, 83], // G: G B D G B
]
const HOME = CHORDS[0]
/** Which note of the chord each sixteenth plays: up the chord and back, twice a bar. */
const SHAPE = [0, 1, 2, 3, 4, 3, 2, 1]
/** Names that come in a crowd share a sixteenth, this many at most, each a third or so from the last. */
const VOICES = 2

export interface Tune {
  /** How a sound heard at `now` (s) plays in the tune: in time, and a name in the chord. Null leaves it out. */
  place(cue: Cue, options: PlayOptions, now: number): PlayOptions | null
  /** Goes home at the next bar line: what to play there. Names from then on are in the home chord. */
  resolve(now: number): [Cue, PlayOptions][]
  /** When (s) it has played out, once it's resolved. */
  readonly over: number
}

/**
 * The plant playing a tune as it opens: each folder's knock on a beat, its names
 * on the sixteenths after, each the note the arpeggio is on at that moment rather
 * than one up from the last, through I–vi–IV–V until `resolve` takes it home. The
 * first knock heard is the first beat.
 */
export function createTune(): Tune {
  let start: number | null = null
  let home = Infinity
  let over = Infinity
  // How many names each sixteenth already carries.
  const taken = new Map<number, number>()

  // Nudged forward by a hair, so a time exactly on a bar line, give or take rounding, is in that bar.
  const chordAt = (time: number) => (time >= home - 1e-6 ? HOME : CHORDS[Math.floor((time - start! + 1e-6) / BAR) % CHORDS.length])
  /** The nearest sprout file to a note, and how far to bend it. */
  const tuned = (note: number): PlayOptions => {
    const step = NOTES.reduce((best, file, i) => (Math.abs(file - note) < Math.abs(NOTES[best] - note) ? i : best), 0)
    return { step, semitones: note - NOTES[step] }
  }

  return {
    get over() {
      return over
    },

    place(cue, options, now) {
      start ??= now + LEAD
      if (cue === 'open') {
        const beat = Math.round((now - start) / BEAT)
        let on = start + beat * BEAT
        // A frame that came too late pulls the beat along with it.
        if (on < now) {
          start += now - on
          on = now
        }
        const downbeat = beat % 4 === 0
        return { ...options, delay: on - now, gain: (options.gain ?? 1) * (downbeat ? 1.15 : 0.8), exact: true }
      }
      if (cue === 'close') {
        // Off the beat, between the opening knocks.
        const at = start + (Math.ceil((now - start) / BEAT - 0.5) + 0.5) * BEAT
        return { ...options, delay: at - now, gain: (options.gain ?? 1) * 0.8, exact: true }
      }
      if (cue !== 'sprout') return options
      let slot = Math.ceil((now - start) / SLOT)
      while ((taken.get(slot) ?? 0) >= VOICES) slot++
      const at = start + slot * SLOT
      if (at - now > WAIT) return null
      const voice = taken.get(slot) ?? 0
      taken.set(slot, voice + 1)
      const chord = chordAt(at)
      const index = SHAPE[slot % 8] + (voice === 0 ? 0 : SHAPE[slot % 8] + 2 < chord.length ? 2 : -2)
      return { ...options, ...tuned(chord[index]), delay: at - now, exact: true }
    },

    resolve(now) {
      start ??= now + LEAD
      home = start + Math.ceil((now - start + BEAT / 2) / BAR) * BAR
      over = home + BAR
      const first = Math.round((home - start) / SLOT)
      for (let slot = first; slot < first + 2; slot++) taken.set(slot, VOICES)
      const delay = home - now
      return [
        ['open', { delay, gain: 1.15, exact: true }],
        ...[72, 76, 79, 84].map((note, i): [Cue, PlayOptions] => ['sprout', { ...tuned(note), delay: delay + i * ROLL, gain: 1.2, exact: true }]),
      ]
    },
  }
}
