import { useEffect, useMemo, useRef } from 'react'
import { PixelIcon } from '../icons'
import { Blocks, Figure, inline, parse, type Block, type MarkdownStyle } from './Markdown.tsx'

interface Props {
  /** Where it sits in the tree, shown in the bar. */
  path: string
  /** Who it was for and what I did: the folder's note. */
  kicker?: string
  body: string
  next: { label: string; go: () => void }
  onClose: () => void
}

/**
 * A case study, as a page over the plant, in the reference's case template: a
 * sticky bar with a close and a next pill, a centred header, the hero, then
 * labelled sections. In the Markdown, the `# heading` is the title, the
 * paragraph after it the summary, the first image the hero, and each
 * `## Label.` starts a section.
 */
export function CaseStudy({ path, kicker, body, next, onClose }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const { title, summary, hero, sections } = useMemo(() => shape(parse(body)), [body])

  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
    scroller.current?.focus()
  }, [path])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={scroller}
      tabIndex={-1}
      role="dialog"
      aria-label={title}
      className="fixed inset-0 z-30 overflow-y-auto bg-page outline-none motion-safe:animate-enter"
    >
      <div className="sticky top-0 z-10 mx-auto flex max-w-1278 items-center justify-between px-24 pt-24 sm:px-60 sm:pt-48">
        <button type="button" onClick={onClose} aria-label="Back to the tree" className={`${PILL} size-38 justify-center px-0`}>
          <PixelIcon name="close" pixel={1.6} />
        </button>
        <span className="hidden text-meta text-muted md:block">{path}</span>
        <button type="button" onClick={next.go} className={PILL}>
          Next: {next.label}
        </button>
      </div>

      <header className="mx-auto max-w-846 px-24 pt-72 text-center">
        {kicker && <p className="text-copy-tight text-body">{kicker}</p>}
        <h1 className="mt-20 text-headline-sm text-ink sm:text-headline">{inline(title)}</h1>
        {summary && <p className="mx-auto mt-50 max-w-504 text-copy-tight text-body">{inline(summary)}</p>}
      </header>

      {hero && <Figure block={hero} className="mx-auto mt-35 max-w-846 px-24" imageClass="rounded-[24px] sm:rounded-[40px]" captionClass={CAPTION} />}

      <main className="mx-auto max-w-798 px-24 pb-160">
        {sections.map((section, i) => (
          <section key={i} className={`${i === 0 ? 'mt-120' : 'mt-83'} sm:flex sm:gap-30`}>
            <h2 className="mb-10 shrink-0 text-copy-tight text-ink sm:mb-0 sm:w-87">{section.label}</h2>
            <div className="min-w-0 flex-1">
              <Blocks blocks={section.blocks} styles={SECTION} />
            </div>
          </section>
        ))}
        <p className="mt-120 flex flex-wrap justify-between gap-12 text-copy-tight">
          <button type="button" onClick={onClose} className="cursor-pointer text-accent hover:underline">
            ← back to the tree
          </button>
          <button type="button" onClick={next.go} className="cursor-pointer text-accent hover:underline">
            next: {next.label} →
          </button>
        </p>
      </main>
    </div>
  )
}

const PILL =
  'flex h-38 cursor-pointer items-center rounded-full border border-line bg-page px-16 text-small text-ink shadow-pill outline-none transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent'

const CAPTION = 'mt-10 text-center text-meta text-muted'

const SECTION: MarkdownStyle = {
  heading: { 1: 'mt-30 text-heading text-ink', 2: 'mt-30 text-copy-tight text-ink', 3: 'mt-24 text-copy-tight text-ink' },
  paragraph: 'mt-16 text-copy-tight text-body first:mt-0',
  list: 'mt-16 flex flex-col gap-4 text-copy-tight text-body first:mt-0',
  figure: 'mt-30 sm:-mx-24',
  caption: CAPTION,
}

interface Section {
  label: string
  blocks: Block[]
}

function shape(blocks: Block[]) {
  let title = ''
  let summary: string | undefined
  let hero: Extract<Block, { kind: 'figure' }> | undefined
  const sections: Section[] = []
  for (const block of blocks) {
    if (block.kind === 'heading' && block.level === 1 && !title) title = block.text
    else if (block.kind === 'heading' && block.level === 2) sections.push({ label: block.text, blocks: [] })
    else if (sections.length) sections[sections.length - 1].blocks.push(block)
    else if (block.kind === 'paragraph' && !summary) summary = block.text
    else if (block.kind === 'figure' && !hero) hero = block
  }
  return { title, summary, hero, sections }
}
