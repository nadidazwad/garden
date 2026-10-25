import { labelArea } from '../garden/labels.ts'
import type { Bounds, GroveBranch, GroveNode, Vec2 } from '../grove'
import { phone, type Entry } from '../portfolio'

/** Labels with less breathing room than this from a branch (leaves included) or a twig get flagged. */
const ROOM = { branch: 22, limb: 10 }

export function distance([px, py]: Vec2, box: Bounds) {
  const dx = Math.max(box.minX - px, 0, px - box.maxX)
  const dy = Math.max(box.minY - py, 0, py - box.maxY)
  return Math.hypot(dx, dy)
}

/** The branches that run too close to a node's label. */
export function crowdedBy(node: GroveNode<Entry>, branches: GroveBranch[]): GroveBranch[] {
  const box = labelArea(node, { icon: false })
  // Every icon hangs off its parent's branch, and a folder's own branch leaves from its corner.
  const expected = (branch: GroveBranch, p: Vec2) =>
    (branch.id === node.parent || branch.id === node.id) && Math.hypot(p[0] - node.at[0], p[1] - node.at[1]) < 50
  return branches.filter(
    (branch) =>
      branch.path.points.some((p) => !expected(branch, p) && distance(p, box) < ROOM.branch) ||
      branch.limbs.some((limb) => limb.points.some((p) => distance(p, box) < ROOM.limb)),
  )
}

const COLUMN = phone.frame.width
/** The hello folder in the phone's corner, at a typical phone's scale. */
export const HELLO: Bounds = (() => {
  const scale = 390 / COLUMN
  const right = COLUMN - 30 / scale
  const bottom = phone.ground - 26 / scale
  return { minX: right - 99 / scale, maxX: right, minY: bottom - 33 / scale, maxY: bottom }
})()
const WORDS = [phone.masthead.time.box, phone.masthead.intro.box, phone.masthead.name.box, HELLO]

/** What a phone visitor would see wrong with what's open: labels off the edge, on each other, on words or under branches. */
export function problemsOnPhone(nodes: GroveNode<Entry>[], branches: GroveBranch[]) {
  const problems: { ids: string[]; text: string }[] = []
  const areas = nodes.map((node) => labelArea(node))
  nodes.forEach((node, i) => {
    const area = areas[i]
    if (area.minX < 4 || area.maxX > COLUMN - 4) problems.push({ ids: [node.id], text: `${node.id} runs off the side` })
    if (WORDS.some((words) => overlaps(area, words))) problems.push({ ids: [node.id], text: `${node.id} sits on the words` })
    for (let j = i + 1; j < nodes.length; j++) {
      if (overlaps(area, areas[j])) problems.push({ ids: [node.id, nodes[j].id], text: `${node.id} and ${nodes[j].id} overlap` })
    }
    const near = crowdedBy(node, branches)
    if (near.length) problems.push({ ids: [node.id], text: `${node.id} is crowded by ${near.map((branch) => branch.id).join(', ')}` })
  })
  for (const branch of branches) {
    const points = [...branch.path.points, ...branch.limbs.flatMap((limb) => limb.points)]
    if (WORDS.some((words) => points.some((p) => distance(p, words) < 8))) problems.push({ ids: [], text: `${branch.id}’s branch runs into the words` })
  }
  return problems
}

const overlaps = (a: Bounds, b: Bounds) => a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
