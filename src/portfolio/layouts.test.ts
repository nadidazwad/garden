import { describe, expect, it } from 'vitest'
import { mismatches, place, type Placements } from './place.ts'
import phoneGeometry from './phone.json'
import { portfolio } from './tree.ts'

describe('the phone layout', () => {
  // Renaming, adding or removing anything in tree.ts means placing it again in phone.json (/__overview/phone).
  it('places every file and folder in the tree, and nothing that isn’t there', () => {
    expect(mismatches(portfolio, phoneGeometry as unknown as Placements)).toEqual([])
  })

  it('keeps every name and caption from the tree, and takes only the geometry', () => {
    const tree = {
      name: 'Root',
      branch: { path: [[0, 0], [100, 0]] },
      children: [
        { name: 'a', at: [1, 1], label: 'right', data: 'folder a', branch: { path: [[5, 5]] }, children: [{ name: 'b.txt', at: [2, 2], label: 'left', data: 'file b' }] },
      ],
    } as const satisfies Parameters<typeof place>[0]
    const placed = place(tree, {
      '/': { branch: { path: [[0, 9], [9, 9]] } },
      '/a': { at: [50, 50], label: 'below', branch: { path: [[60, 0]] } },
      '/a/b.txt': { at: [70, 10], label: 'right' },
    })
    expect(placed).toEqual({
      name: 'Root',
      branch: { path: [[0, 9], [9, 9]] },
      children: [
        { name: 'a', at: [50, 50], label: 'below', data: 'folder a', branch: { path: [[60, 0]] }, children: [{ name: 'b.txt', at: [70, 10], label: 'right', data: 'file b' }] },
      ],
    })
  })
})
