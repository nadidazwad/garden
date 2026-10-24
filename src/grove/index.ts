// The file tree drawn as a plant: what grows where, and how it moves.
// No three.js here; src/scene draws it and src/finder labels it.
export { documents } from './documents.ts'
export { createGrove, type Grove } from './grove.ts'
export {
  ROOT_ID,
  type FolderSpec,
  type GroveBranch,
  type GroveNode,
  type Limb,
  type Polyline,
  type Vec2,
} from './layout.ts'
export { CELL, pixelGrid, type PixelGrid } from './view.ts'
