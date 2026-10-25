import type { BranchSpec, EntrySpec, FolderSpec, LabelSide, Vec2 } from '../grove'

/** Where one entry sits and which side its name hangs; a folder also has its branch. The trunk has only a branch. */
export interface Placement {
  at?: Vec2
  label?: LabelSide
  branch?: BranchSpec
}

/** A whole layout's geometry, by path: `/` is the trunk, `/work/attar` a folder in it. */
export type Placements = Record<string, Placement>

const childPath = (parent: string, name: string) => (parent === '/' ? `/${name}` : `${parent}/${name}`)

/** Every path in the tree, the trunk's `/` first, depth first. */
export function pathsOf(tree: FolderSpec<unknown>): string[] {
  const paths = ['/']
  const visit = (folder: FolderSpec<unknown>, id: string) => {
    for (const child of folder.children) {
      paths.push(childPath(id, child.name))
      if ('branch' in child) visit(child, childPath(id, child.name))
    }
  }
  visit(tree, '/')
  return paths
}

/** What doesn't line up between a tree and the geometry meant for it: entries left unplaced, and placements for entries that aren't there. */
export function mismatches(tree: FolderSpec<unknown>, placements: Placements): string[] {
  const paths = pathsOf(tree)
  const folders = new Set(paths.filter((path) => isFolder(tree, path)))
  const problems: string[] = []
  for (const path of paths) {
    const placement = placements[path]
    if (!placement) problems.push(`${path} isn’t placed`)
    else if (path !== '/' && (!placement.at || !placement.label)) problems.push(`${path} needs a point and a label side`)
    else if (folders.has(path) && !placement.branch) problems.push(`${path} needs a branch`)
  }
  const known = new Set(paths)
  for (const path of Object.keys(placements)) if (!known.has(path)) problems.push(`${path} isn’t in the tree`)
  return problems
}

function isFolder(tree: FolderSpec<unknown>, path: string) {
  let folder: FolderSpec<unknown> | undefined = tree
  for (const name of path.split('/').slice(1)) {
    const child: EntrySpec<unknown> | undefined = folder?.children.find((entry) => entry.name === name)
    folder = child && 'branch' in child ? child : undefined
  }
  return folder !== undefined
}

/**
 * The same tree with other geometry: every entry keeps its name and data and
 * takes its point, label side and branch from `placements`. An entry left out
 * hangs off its parent rather than breaking the page; `mismatches` names it.
 */
export function place<T>(tree: FolderSpec<T>, placements: Placements): FolderSpec<T> {
  const placeFolder = (folder: FolderSpec<T>, id: string, at: Vec2): FolderSpec<T> => ({
    ...folder,
    branch: placements[id]?.branch ?? { path: [[at[0] + 24, at[1] - 40]] },
    children: folder.children.map((child): EntrySpec<T> => {
      const path = childPath(id, child.name)
      const own = placements[path]
      const spot: Vec2 = own?.at ?? at
      const label = own?.label ?? 'right'
      return 'branch' in child ? { ...placeFolder(child, path, spot), at: spot, label } : { ...child, at: spot, label }
    }),
  })
  const trunk = placements['/']?.branch?.path
  return placeFolder(tree, '/', trunk ? trunk[trunk.length - 1] : [0, 0])
}
