import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { inline } from '../Markdown.tsx'
import { Bar, TAIL } from './Bar.tsx'
import { Stats, Threads } from './Cards.tsx'
import { Compare } from './Compare.tsx'
import { gallery, parseCase, type Block, type Media, type Section } from './parse.ts'
import { Strip } from './Strip.tsx'
import { Terms } from './Terms.tsx'
import { ratio } from './media.ts'
import { Tile } from './Tile.tsx'
import { Viewer } from './Viewer.tsx'

/** How long the page takes to grow in over the plant, in ms. */
export const PAGE_IN = 760
const PAGE_OUT = 300

interface Props {
  /** Where it sits in the tree; a new path starts back at the top. */
  path: string
  /** The folder's note, for a case study that doesn't set its own kicker. */
  kicker?: string
  body: string
  next: { label: string; go: () => void }
  /** It's been closed: fall back from the plant, then call `onGone`. */
  leaving: boolean
  onClose: () => void
  onGone: () => void
}

/**
 * A case study, as a page that fills in over the plant: the reference's case
 * template on white. The Markdown dialect it reads is described in `parse.ts`.
 */
export function CaseStudy({ path, kicker, body, next, leaving, onClose, onGone }: Props) {
  const page = useRef<HTMLDivElement>(null)
  const doc = useMemo(() => parseCase(body), [body])
  const pieces = useMemo(() => gallery(doc), [doc])
  // The viewer belongs to the page it opened on; moving to the next case study closes it.
  const [opened, setOpen] = useState<{ path: string; index: number } | null>(null)
  const viewing = opened?.path === path ? opened.index : null
  const setViewing = (index: number | null) => setOpen(index === null ? null : { path, index })
  const open = (media: Media) => setViewing(pieces.indexOf(media))

  // A reload while reading comes back to the same spot; any other arrival starts at the top.
  useEffect(() => {
    const element = page.current
    if (!element) return
    element.scrollTo(0, reloaded?.path === path ? reloaded.top : 0)
    // Only the arrival comes back; a microtask, so StrictMode's second run in dev still sees it.
    queueMicrotask(() => (reloaded = null))
    element.focus()
    const keep = () => {
      try {
        sessionStorage.setItem(KEPT, JSON.stringify({ path, top: element.scrollTop }))
      } catch {
        // Storage can be off; the reload starts at the top.
      }
    }
    window.addEventListener('pagehide', keep)
    return () => window.removeEventListener('pagehide', keep)
  }, [path])

  // The page grows out of the middle of the screen, rounding off its corners as it fills.
  // Two animations: on its own, the grow runs on the compositor and keeps moving while
  // the page's first paint is still rastering; with the corners in it, it would wait for that.
  useEffect(() => {
    const element = page.current
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timing = { duration: PAGE_IN, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' } as const
    element.animate([{ opacity: 0, transform: 'scale(0.9) translateY(26px)' }, { opacity: 1, transform: 'none' }], timing)
    element.animate([{ borderRadius: '28px' }, { borderRadius: '0px' }], timing)
  }, [])

  // Closed, it falls back the way it came, quicker, and the plant shows through as it goes.
  useEffect(() => {
    const element = page.current
    if (!leaving || !element) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return onGone()
    const timing = { duration: PAGE_OUT, easing: 'cubic-bezier(0.4, 0, 0.9, 0.6)', fill: 'forwards' } as const
    const fall = element.animate([{ opacity: 1, transform: 'none', borderRadius: '0px' }, { opacity: 0, transform: 'scale(0.94) translateY(20px)', borderRadius: '28px' }], timing)
    fall.finished.then(onGone, () => {})
    return () => fall.cancel()
  }, [leaving, onGone])

  // The edge blur waits for the page to settle: six backdrop filters cost the opening frame more than everything else together.
  const [grown, setGrown] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const timer = setTimeout(() => setGrown(true), PAGE_IN)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (viewing !== null || leaving) return
    const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose, viewing, leaving])

  const shownKicker = doc.kicker ?? kicker
  return (
    <div
      ref={page}
      tabIndex={-1}
      role="dialog"
      aria-label={doc.title.replace(/\*\*|_/g, '')}
      inert={leaving}
      className={`fixed inset-0 z-30 overflow-x-clip bg-white text-copy-tight outline-none ${viewing === null ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
    >
      <Bar scroller={page} onClose={onClose} onNext={next.go} />

      <div className="mx-auto w-full max-w-846 px-24">
        <header className="pt-12 text-center">
          {shownKicker && <p className="text-small text-body sm:text-copy-tight">{inline(shownKicker)}</p>}
          <h1 className="mt-14 text-headline-sm text-ink-strong sm:mt-20 sm:text-headline">{inline(doc.title, 'text-ink-strong')}</h1>
          {doc.summary && <p className="mx-auto mt-34 w-504 max-w-full text-body sm:mt-50">{inline(doc.summary, 'text-accent')}</p>}
        </header>

        {doc.hero.length > 0 && (
          <Frame>
            <Rows rows={doc.hero} tile={SCREEN} />
          </Frame>
        )}

        <div className="mt-120 flex flex-col">
          {doc.sections.map((section, i) => (
            <SectionView key={i} section={section} first={i === 0} open={open} />
          ))}
        </div>
      </div>

      {/* On phones the pills share the copy's column, so the page runs on far enough for them to settle below it. */}
      <div className="h-(--tail) max-sm:h-[calc(var(--tail)+68px)]" style={{ '--tail': `${TAIL}px` } as CSSProperties} />
      {grown && <Blur />}
      {viewing !== null && viewing >= 0 && <Viewer items={pieces} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

const KEPT = 'case-study-scroll'

/** Where the visitor was in a case study when they reloaded it, read once as the page loads. */
let reloaded = (() => {
  try {
    const kept = JSON.parse(sessionStorage.getItem(KEPT) ?? 'null') as { path: string; top: number } | null
    sessionStorage.removeItem(KEPT)
    return kept
  } catch {
    return null
  }
})()

type Run = { note: true; blocks: Block[] } | { note: false; block: Block }

const NOTE_KINDS = new Set<Block['kind']>(['text', 'list', 'terms', 'threads'])

/**
 * A section's words sit in a note, label left and copy right; its media breaks
 * out to the full 798px column. Words after media start a fresh note under the
 * same label column.
 */
function SectionView({ section, first, open }: { section: Section; first: boolean; open: (media: Media) => void }) {
  const runs: Run[] = []
  for (const block of section.blocks) {
    const last = runs.at(-1)
    if (!NOTE_KINDS.has(block.kind)) runs.push({ note: false, block })
    else if (last?.note) last.blocks.push(block)
    else runs.push({ note: true, blocks: [block] })
  }
  return (
    <section style={{ marginTop: first ? 0 : 83 }}>
      {runs.map((run, i) =>
        run.note ? (
          <Note key={i} label={section.label} showLabel={i === 0} className={i ? 'mt-35' : ''}>
            {run.blocks.map((block, j) => (
              <Words key={j} block={block} open={open} />
            ))}
          </Note>
        ) : (
          <Breakout key={i} block={run.block} open={open} />
        ),
      )}
    </section>
  )
}

function Note({ label, showLabel, className, children }: { label?: string; showLabel: boolean; className: string; children: ReactNode }) {
  return (
    <div className={`mx-auto flex w-full max-w-798 flex-col gap-6 sm:flex-row sm:gap-30 ${className}`}>
      {label !== undefined && <p className={`shrink-0 text-ink-strong sm:w-87 ${showLabel ? '' : 'max-sm:hidden sm:invisible'}`}>{label}</p>}
      <div className="min-w-0 flex-1 text-body">{children}</div>
    </div>
  )
}

function Words({ block, open }: { block: Block; open: (media: Media) => void }) {
  switch (block.kind) {
    case 'text':
      return <p className="mt-21 first:mt-0">{inline(block.text, 'text-ink-strong')}</p>
    case 'list':
      return (
        <ul className="mt-21 flex flex-col gap-4 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-10">
              <span aria-hidden className="mt-[9.5px] size-3 shrink-0 bg-faint" />
              <span>{inline(item, 'text-ink-strong')}</span>
            </li>
          ))}
        </ul>
      )
    case 'terms':
      return <Terms intro={block.intro} items={block.items} open={open} />
    case 'threads':
      return <Threads items={block.items} />
    default:
      return null
  }
}

function Breakout({ block, open }: { block: Block; open: (media: Media) => void }) {
  switch (block.kind) {
    case 'figure':
      return (
        <Frame>
          <Rows rows={block.rows} tile={SCREEN} />
        </Frame>
      )
    case 'compare':
      return (
        <Frame>
          <Compare pairs={block.pairs} />
        </Frame>
      )
    case 'strip':
      return <Strip rows={block.rows} open={open} />
    case 'stats':
      return <Stats items={block.items} />
    default:
      return null
  }
}

/** A screenshot's own hairline, so a light interface keeps its edges on the white mat. */
const SCREEN = 'rounded-[20px] border border-[#d2d2d2]'

/** The white mat the reference sets screenshots in. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="mx-auto mt-35 w-full max-w-798 overflow-hidden rounded-[40px] border-[1.392px] border-[#eaeaea] bg-white p-[21.529px]">{children}</div>
}

/** Rows of tiles at their own shapes, sharing each row's width; they stack on narrow screens. */
function Rows({ rows, tile }: { rows: Media[][]; tile: string }) {
  return (
    <div className="flex flex-col gap-7">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-7 max-[899px]:flex-col">
          {row.map((media) => (
            <div
              key={media.src}
              className={`relative min-w-0 overflow-hidden max-[899px]:w-full max-[899px]:flex-none! ${tile}`}
              style={{ aspectRatio: ratio(media), flex: `${ratio(media)} 1 0%` }}
            >
              <Tile media={media} eager={i === 0} className="rounded-[inherit]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const BLURS = [0.5, 1, 2, 4, 8, 16]
const FADE_IN = 'transition-opacity duration-300 ease-out starting:opacity-0'

/**
 * Copy softens out of focus as it nears the bottom edge, on screens wide enough to read it beside.
 * Each layer fades in by its own opacity: on the wrapper, opacity would cut the layers off from what's behind them.
 */
function Blur() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-89 max-[899px]:hidden">
      {BLURS.map((blur, i) => {
        const mask = `linear-gradient(to bottom, transparent ${i * 16}%, black ${i * 16 + 20}%)`
        return (
          <div
            key={blur}
            className={`absolute inset-0 ${FADE_IN}`}
            style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }}
          />
        )
      })}
      <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-white/72 ${FADE_IN}`} />
    </div>
  )
}
