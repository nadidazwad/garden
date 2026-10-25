// A case study is Markdown with a few shapes of its own, one per part of the
// reference's case template. Chunks are separated by blank lines.
//
//   Role @ Company · Year             a paragraph before the title is the kicker
//   # Title
//   A summary.                        the paragraph after the title; **phrases** go accent
//   ![alt](/path.mp4)                 images before the first section are the hero
//   ## Label.                         starts a section; a bare ## starts one without a label
//   - **Term** what it is ![alt](/p)  a list of bold terms is a deliverables list, media optional
//   > **Title:** what it means        quote lines are thread cards that open for more
//   ![a](/x.png) ![b](/y.png)         image-only lines are a framed figure, a row per line
//   :::strip … :::                    rows of tiles that drift sideways and drag
//   :::compare … :::                  "Tab: ![Before](/a.png) ![After](/b.png)" lines, a before/after slider
//   | 16 wks | Label. | Body |        table rows are number cards
//
// Media paths are tree-style paths (see `media.ts`); a `.mp4` path is a film.

export interface Media {
  src: string
  alt: string
}

export interface Term {
  term: string
  body: string
  media?: Media
}

export interface Thread {
  title: string
  body: string
}

export interface Stat {
  value: string
  label: string
  body: string
}

export interface Pair {
  tab: string
  before: Media
  after: Media
}

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'terms'; intro?: string; items: Term[] }
  | { kind: 'threads'; items: Thread[] }
  | { kind: 'figure'; rows: Media[][] }
  | { kind: 'strip'; rows: Media[][] }
  | { kind: 'compare'; pairs: Pair[] }
  | { kind: 'stats'; items: Stat[] }

export interface Section {
  label?: string
  blocks: Block[]
}

export interface CaseDoc {
  kicker?: string
  title: string
  summary?: string
  hero: Media[][]
  sections: Section[]
}

export function parseCase(source: string): CaseDoc {
  const doc: CaseDoc = { title: '', hero: [], sections: [] }
  for (const chunk of source.trim().split(/\n\s*\n/)) {
    let lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const heading = /^(#{1,2})(?:\s+(.*))?$/.exec(lines[0])
    if (heading) {
      if (heading[1] === '#') doc.title = heading[2] ?? ''
      else doc.sections.push({ label: heading[2] || undefined, blocks: [] })
      lines = lines.slice(1)
      if (!lines.length) continue
    }
    const block = toBlock(lines)
    const section = doc.sections.at(-1)
    if (section) add(section.blocks, block)
    else if (!doc.title && block.kind === 'text') doc.kicker = block.text
    else if (block.kind === 'text' && doc.summary === undefined) doc.summary = block.text
    else if (block.kind === 'figure') doc.hero.push(...block.rows)
  }
  return doc
}

/** Every film and still a visitor can open full size, in reading order: deliverables, then strips. */
export function gallery(doc: CaseDoc): Media[] {
  return doc.sections.flatMap((section) =>
    section.blocks.flatMap((block) => {
      if (block.kind === 'terms') return block.items.flatMap((item) => (item.media ? [item.media] : []))
      if (block.kind === 'strip') return block.rows.flat()
      return []
    }),
  )
}

/** A deliverables list takes the paragraph just before it as its intro, beside the list/cards switch. */
function add(blocks: Block[], block: Block) {
  const last = blocks.at(-1)
  if (block.kind === 'terms' && last?.kind === 'text') {
    blocks.pop()
    block.intro = last.text
  }
  blocks.push(block)
}

const IMAGE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const BOLD = /^\*\*(.+?)\*\*\s*/

function media(line: string): Media[] {
  return [...line.matchAll(IMAGE)].map(([, alt, src]) => ({ alt, src }))
}

function imageRow(line: string) {
  const found = media(line)
  return found.length && !line.replace(IMAGE, '').trim() ? found : null
}

function toBlock(lines: string[]): Block {
  const fence = /^:::(strip|compare)$/.exec(lines[0])
  if (fence) {
    const body = lines.slice(1, lines.at(-1) === ':::' ? -1 : undefined)
    if (fence[1] === 'strip') return { kind: 'strip', rows: body.map((line) => imageRow(line) ?? []).filter((row) => row.length) }
    const pairs = body.flatMap((line) => {
      const [before, after] = media(line)
      if (!before || !after) return []
      return [{ tab: line.slice(0, line.indexOf('![')).replace(/:\s*$/, '').trim(), before, after }]
    })
    return { kind: 'compare', pairs }
  }
  const rows = lines.map(imageRow)
  if (rows.every((row) => row !== null)) return { kind: 'figure', rows }
  if (lines.every((line) => line.startsWith('|'))) return { kind: 'stats', items: lines.map(stat) }
  if (lines.every((line) => line.startsWith('>'))) return { kind: 'threads', items: lines.map((line) => thread(line.replace(/^>\s*/, ''))) }
  if (lines.every((line) => line.startsWith('- '))) {
    const items = lines.map((line) => line.slice(2))
    return items.every((item) => BOLD.test(item)) ? { kind: 'terms', items: items.map(term) } : { kind: 'list', items }
  }
  return { kind: 'text', text: lines.join(' ') }
}

function term(item: string): Term {
  const text = item.replace(IMAGE, '').trim()
  const bold = BOLD.exec(text)!
  return { term: bold[1], body: text.slice(bold[0].length).trim(), media: media(item)[0] }
}

function thread(line: string): Thread {
  const bold = BOLD.exec(line)
  return bold ? { title: bold[1], body: line.slice(bold[0].length).trim() } : { title: line, body: '' }
}

function stat(line: string): Stat {
  const [value = '', label = '', body = ''] = line
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
  return { value, label, body }
}
