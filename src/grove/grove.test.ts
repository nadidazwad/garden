import { describe, expect, it } from 'vitest'
import { createGrove, type FolderSpec, type Grove } from '.'

// Root ─┬─ a/ ── b/ ── c.txt
//       └─ d.txt
const tree: FolderSpec = {
  name: 'Root',
  branch: { width: 4, path: [[0, 0], [100, 0], [200, 0]] },
  children: [
    {
      name: 'a',
      at: [50, -20],
      label: 'right',
      branch: { path: [[55, -100], [50, -200]] },
      children: [
        {
          name: 'b',
          at: [70, -100],
          label: 'right',
          branch: { path: [[150, -100], [250, -100]] },
          children: [{ name: 'c.txt', at: [200, -90], label: 'right' }],
        },
      ],
    },
    { name: 'd.txt', at: [180, 10], label: 'right' },
  ],
}

function settle(grove: Grove, seconds = 6) {
  for (let t = 0; t < seconds; t += 1 / 60) grove.step(1 / 60)
}

describe('grove', () => {
  it('grows the top level, then a folder’s children when it opens', () => {
    const grove = createGrove(tree)
    settle(grove)
    expect(grove.count).toBe(2)
    expect(grove.isVisible('/a/b')).toBe(false)

    grove.toggle('/a')
    expect(grove.isOpen('/a')).toBe(true)
    settle(grove)
    expect(grove.isVisible('/a/b')).toBe(true)
    expect(grove.count).toBe(3)
  })

  it('grows a folder’s branch out of the folder, apart from its parent’s branch', () => {
    const grove = createGrove(tree)
    const [x, y] = grove.layout.branches.get('/a')!.path.points[0]
    expect(Math.hypot(x - 50, y + 20)).toBeLessThan(20)
    // The trunk runs along y = 0; the new branch doesn't reach back to it.
    expect(Math.max(...grove.layout.branches.get('/a')!.path.points.map(([, py]) => py))).toBeLessThan(-20)
  })

  it('grows stouter branches from folders that hold more', () => {
    const { branches } = createGrove(tree).layout
    expect(branches.get('/a')!.load).toBe(2)
    expect(branches.get('/a/b')!.load).toBe(1)
    expect(branches.get('/a')!.width).toBeGreaterThan(branches.get('/a/b')!.width)
  })

  it('closing a folder retracts its open descendants first', () => {
    const grove = createGrove(tree)
    settle(grove)
    grove.toggle('/a')
    settle(grove)
    grove.toggle('/a/b')
    settle(grove)
    expect(grove.count).toBe(4)

    grove.toggle('/a')
    const gone = new Map<string, number>()
    for (let frame = 0; frame < 600; frame++) {
      grove.step(1 / 60)
      for (const id of ['/a/b/c.txt', '/a/b']) {
        if (!gone.has(id) && !grove.isVisible(id)) gone.set(id, frame)
      }
      // A branch never floats without its folder, and a folder looks open until its branch is gone.
      if (grove.growth('/a/b') > 0) expect(grove.isVisible('/a/b')).toBe(true)
      if (grove.isVisible('/a/b')) expect(grove.isOpen('/a')).toBe(true)
    }

    expect(gone.get('/a/b/c.txt')!).toBeLessThan(gone.get('/a/b')!)
    expect(grove.isOpen('/a')).toBe(false)
    expect(grove.isOpen('/a/b')).toBe(false)
    expect(grove.count).toBe(2)
  })

  it('grows fast at first, eases into the tip, and snaps back quickly', () => {
    const grove = createGrove(tree)
    settle(grove)
    const length = grove.layout.branches.get('/a')!.path.length
    grove.toggle('/a')
    const grown: number[] = []
    for (let frame = 0; frame < 120; frame++) {
      grove.step(1 / 60)
      grown.push(grove.growth('/a'))
    }
    // A tenth of a second in, a good stretch is already out...
    expect(grown[5]).toBeGreaterThan(length * 0.25)
    // ...and it reaches the tip barely moving.
    const done = grown.findIndex((g) => g >= length)
    expect(done).toBeGreaterThan(0)
    expect(grown[done] - grown[done - 6]).toBeLessThan(length * 0.02)

    grove.toggle('/a')
    settle(grove, 0.2)
    expect(grove.growth('/a')).toBe(0)
  })

  it('keeps the trunk entering from the left edge, and only pans once the plant outgrows the view', () => {
    const grove = createGrove(tree)
    grove.setView(1600, 900)
    // The trunk starts at x = 0 and a little of its base stays tucked off screen.
    const leftEdge = (width: number) => grove.camera[0] - width / 2
    expect(leftEdge(1600)).toBeGreaterThan(0)
    expect(leftEdge(1600)).toBeLessThan(80)

    settle(grove)
    expect(grove.canPan).toBe(false)
    const before = grove.camera
    grove.pan(120, 80)
    expect(grove.camera).toEqual(before)

    grove.setView(160, 120)
    grove.toggle('/a')
    settle(grove)
    expect(grove.canPan).toBe(true)
    const [x] = grove.camera
    grove.pan(40, 0)
    expect(grove.camera[0]).toBeCloseTo(x + 40)

    // Dragging or flinging toward the wall stops at it.
    grove.pan(-500, 0)
    expect(leftEdge(160)).toBeGreaterThan(0)
    grove.pan(60, 0)
    grove.fling(-4000, 0)
    settle(grove, 2)
    expect(leftEdge(160)).toBeGreaterThan(0)
    expect(leftEdge(160)).toBeLessThan(80)
  })
})
