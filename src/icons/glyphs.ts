// Pixel icons drawn on the same grid as the dithered plant: one icon pixel is
// one cell. Hovering lifts a glyph with a one-pixel shadow down and to the left.

const FOLDER = `
.####.......
#....#......
#.....#####.
#..........#
#..........#
#..........#
#..........#
#..........#
#..........#
.##########.
`

const OPEN_FOLDER = `
.###...........
#..############
#.#...........#
#.#..........#.
#.#..........#.
##..........#..
##..........#..
##.........#...
#..........#...
###########....
`

const TEXT = `
######...
#....##..
#....#.#.
#....####
#.###...#
#.......#
#.#####.#
#.......#
#.#####.#
#.......#
#.###...#
#########
`

const BLANK = `
######...
#....##..
#....#.#.
#....####
#.......#
#.......#
#.......#
#.......#
#.......#
#.......#
#.......#
#########
`

export type GlyphName = 'folder' | 'openFolder' | 'text' | 'blank'

export interface Glyph {
  /** Size in icon pixels, with room for the shadow so hovering doesn't shift layout. */
  width: number
  height: number
  /** SVG path data, one unit per icon pixel. */
  outline: string
  shadow: string
}

const TEXT_FILES = /\.(txt|md|pdf)$/

/** Documents with words in them show lines; everything else is a blank page. */
export function fileGlyph(name: string): GlyphName {
  return TEXT_FILES.test(name) ? 'text' : 'blank'
}

export const glyphs: Record<GlyphName, Glyph> = {
  folder: compile(FOLDER),
  openFolder: compile(OPEN_FOLDER),
  text: compile(TEXT),
  blank: compile(BLANK),
}

function compile(art: string): Glyph {
  const rows = art.trim().split('\n')
  const width = rows[0].length + 1
  const height = rows.length + 1
  // The glyph sits one pixel in from the left so its shadow fits.
  const on = (x: number, y: number) => rows[y]?.[x - 1] === '#'
  const inside = interior(rows)
  const outline: [number, number][] = []
  const shadow: [number, number][] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (on(x, y)) outline.push([x, y])
      else if (on(x + 1, y - 1) && !inside.has(`${x - 1},${y}`)) shadow.push([x, y])
    }
  }
  return { width, height, outline: toPath(outline), shadow: toPath(shadow) }
}

/** Cells enclosed by the outline, so the shadow only falls outside it. */
function interior(rows: string[]) {
  const width = rows[0].length
  const height = rows.length
  const outside = new Set<string>()
  const queue: [number, number][] = [[-1, -1]]
  while (queue.length) {
    const [x, y] = queue.pop()!
    const key = `${x},${y}`
    if (x < -1 || y < -1 || x > width || y > height || outside.has(key)) continue
    if (rows[y]?.[x] === '#') continue
    outside.add(key)
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  const inside = new Set<string>()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rows[y][x] !== '#' && !outside.has(`${x},${y}`)) inside.add(`${x},${y}`)
    }
  }
  return inside
}

function toPath(cells: [number, number][]) {
  return cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')
}
