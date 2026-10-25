import { Fragment, type ReactNode } from 'react'
import { aspect } from '../portfolio'
import { Still } from './Media.tsx'

// Just enough Markdown for this site's writing. Emphasis is colour, never
// weight: **phrase** turns ink, _phrase_ steps back to muted, links are accent.
// An image on a line of its own is a figure; its src is a media path, not a URL.

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'figure'; alt: string; src: string; caption?: string }

export interface MarkdownStyle {
  heading: Record<1 | 2 | 3, string>
  paragraph: string
  list: string
  figure: string
  caption: string
}

export function Markdown({ source, styles }: { source: string; styles: MarkdownStyle }) {
  return <Blocks blocks={parse(source)} styles={styles} />
}

export function Blocks({ blocks, styles }: { blocks: Block[]; styles: MarkdownStyle }) {
  return blocks.map((block, i) => {
    switch (block.kind) {
      case 'heading': {
        const Tag = (['h1', 'h2', 'h3'] as const)[block.level - 1]
        return (
          <Tag key={i} className={styles.heading[block.level]}>
            {inline(block.text)}
          </Tag>
        )
      }
      case 'paragraph':
        return (
          <p key={i} className={styles.paragraph}>
            {inline(block.text)}
          </p>
        )
      case 'list':
        return (
          <ul key={i} className={styles.list}>
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-10">
                <span aria-hidden className="mt-[11px] size-3 shrink-0 bg-faint" />
                <span>{inline(item)}</span>
              </li>
            ))}
          </ul>
        )
      case 'figure':
        return <Figure key={i} block={block} className={styles.figure} captionClass={styles.caption} />
    }
  })
}

export function parse(source: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of source.trim().split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((line) => line.trim())
    const first = lines[0]
    const heading = /^(#{1,3})\s+(.*)$/.exec(first)
    const figure = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(first)
    if (heading) blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] })
    else if (figure && lines.length === 1) blocks.push({ kind: 'figure', alt: figure[1], src: figure[2], caption: figure[3] })
    else if (lines.every((line) => line.startsWith('- '))) blocks.push({ kind: 'list', items: lines.map((line) => line.slice(2)) })
    else blocks.push({ kind: 'paragraph', text: lines.join(' ') })
  }
  return blocks
}

const INLINE = /\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\(([^)]+)\)/g

/** `strong` is the colour **phrases** take: ink in running copy, accent where the reference's summaries use it. */
export function inline(text: string, strong = 'text-ink'): ReactNode {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const [, ink, quiet, label, href] = match
    if (ink) parts.push(<span className={strong}>{inline(ink, strong)}</span>)
    else if (quiet) parts.push(<span className="text-muted">{inline(quiet, strong)}</span>)
    else {
      const external = /^https?:/.test(href)
      parts.push(
        <a
          href={href}
          className="line-draw text-accent outline-none hover:line-drawn focus-visible:line-drawn"
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {inline(label)}
        </a>,
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)
}

function Figure({
  block,
  className,
  captionClass,
  imageClass = 'rounded-[3px]',
}: {
  block: Extract<Block, { kind: 'figure' }>
  className?: string
  captionClass?: string
  imageClass?: string
}) {
  return (
    <figure className={className}>
      <Still path={block.src} alt={block.alt} lazy className={`w-full ${imageClass}`} style={{ aspectRatio: aspect(block.src) }} />
      {block.caption && <figcaption className={captionClass}>{inline(block.caption)}</figcaption>}
    </figure>
  )
}
