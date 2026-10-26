import { describe, expect, it } from 'vitest'
import { createGrove, type FolderSpec, type Grove } from '../grove'
import type { Entry } from '../portfolio'
import { BEAT, type Cue, type PlayOptions } from '../sound'
import { listenForSounds } from './sounds.ts'

// Root ─┬─ a/ ─┬─ b.png
//       │      ├─ c.png
//       │      ├─ d.md (a case study)
//       │      └─ f/ ── g.png
//       └─ e.txt
const tree: FolderSpec<Entry> = {
  name: 'Root',
  branch: { width: 4, path: [[0, 0], [100, 0], [200, 0]] },
  children: [
    {
      name: 'a',
      at: [50, -20],
      label: 'right',
      data: { kind: 'folder' },
      branch: { path: [[55, -100], [60, -200], [65, -300]] },
      children: [
        { name: 'b.png', at: [60, -100], label: 'right', data: { kind: 'image', caption: '', alt: '' } },
        { name: 'c.png', at: [62, -200], label: 'right', data: { kind: 'image', caption: '', alt: '' } },
        { name: 'd.md', at: [64, -290], label: 'right', data: { kind: 'case', body: '' } },
        {
          name: 'f',
          at: [58, -150],
          label: 'left',
          data: { kind: 'folder' },
          branch: { path: [[20, -160], [-40, -170]] },
          children: [{ name: 'g.png', at: [-30, -180], label: 'left', data: { kind: 'image', caption: '', alt: '' } }],
        },
      ],
    },
    { name: 'e.txt', at: [180, 10], label: 'right', data: { kind: 'text', body: '' } },
  ],
}

function settle(grove: Grove<Entry>, seconds = 4) {
  for (let t = 0; t < seconds; t += 1 / 60) grove.step(1 / 60)
}

function listening() {
  const grove = createGrove(tree)
  settle(grove)
  const heard: [Cue, PlayOptions | undefined][] = []
  listenForSounds(grove, (cue, options) => heard.push([cue, options]))
  return { grove, heard, cues: () => heard.map(([cue]) => cue) }
}

describe('the plant’s sounds', () => {
  it('knocks once as a folder opens, then climbs a note for each name that grows in', () => {
    const { grove, heard, cues } = listening()
    grove.open('/a')
    settle(grove)
    expect(cues()).toEqual(['open', 'sprout', 'sprout', 'sprout', 'sprout'])
    // A folder one level down starts one note up.
    expect(heard.slice(1).map(([, options]) => options?.step)).toEqual([1, 2, 3, 4])
  })

  it('knocks once as a branch goes back in, however many names and open folders it takes with it', () => {
    const { grove, cues } = listening()
    grove.open('/a/f')
    settle(grove)
    const before = cues().length
    grove.close('/a')
    settle(grove)
    expect(cues().slice(before)).toEqual(['close'])
  })

  it('pops a preview out and back, and turns a case study in and out like a page', () => {
    const { grove, cues } = listening()
    grove.open('/e.txt')
    grove.close('/e.txt')
    grove.go('/a/d.md')
    settle(grove)
    grove.close('/a/d.md')
    expect(cues().filter((cue) => cue !== 'sprout' && cue !== 'open')).toEqual(['peek', 'unpeek', 'page', 'pageOut'])
  })

  it('plays the plant opening folder by folder as a tune: knocks on the beat, names on the sixteenths, in C, home at the end', () => {
    const grove = createGrove(tree)
    settle(grove)
    let clock = 0
    // The sprout files, G4 to C6, as MIDI notes.
    const FILES = [67, 69, 72, 74, 76, 79, 81, 84]
    const heard: { cue: Cue; at: number; note: number }[] = []
    listenForSounds(
      grove,
      (cue, { delay = 0, step = 0, semitones = 0 } = {}) => heard.push({ cue, at: clock + delay, note: FILES[step] + semitones }),
      undefined,
      () => clock,
    )
    grove.go('/', { whole: true, pace: BEAT })
    for (let frame = 0; frame < 600; frame++) {
      clock += 1 / 60
      grove.step(1 / 60)
    }
    const start = heard.find(({ cue }) => cue === 'open')!.at
    const offGrid = (at: number, grid: number) => Math.abs((at - start) / grid - Math.round((at - start) / grid)) * grid
    const knocks = heard.filter(({ cue }) => cue === 'open')
    const notes = heard.filter(({ cue }) => cue === 'sprout')
    // A folder each beat (a/, f/ once it shows), then one more to come home on.
    expect(knocks).toHaveLength(3)
    knocks.forEach(({ at }) => expect(offGrid(at, BEAT)).toBeLessThan(1 / 60))
    notes.forEach(({ note }) => expect([0, 2, 4, 5, 7, 9, 11]).toContain(note % 12))
    // Home is a C chord on a bar line, rolled up from it.
    const home = Math.max(...knocks.map(({ at }) => at))
    expect(offGrid(home, 4 * BEAT)).toBeLessThan(1e-9)
    notes.filter(({ at }) => at < home).forEach(({ at }) => expect(offGrid(at, BEAT / 4)).toBeLessThan(1 / 60))
    expect(notes.filter(({ at }) => at >= home && at < home + BEAT / 2).map(({ note }) => note)).toEqual([72, 76, 79, 84])
  })
})
