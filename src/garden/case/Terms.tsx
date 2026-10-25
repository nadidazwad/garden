import { useRef, useState, useSyncExternalStore } from 'react'
import { PixelIcon, type GlyphName } from '../../icons'
import { inline } from '../Markdown.tsx'
import type { Media, Term } from './parse.ts'
import { ratio } from './media.ts'
import { Tile } from './Tile.tsx'

const TOUCH = '(hover: none), (max-width: 639px)'

function useTouch() {
  return useSyncExternalStore(
    (change) => {
      const query = matchMedia(TOUCH)
      query.addEventListener('change', change)
      return () => query.removeEventListener('change', change)
    },
    () => matchMedia(TOUCH).matches,
  )
}

/** The preview's width: the media at 208px tall plus its 5px mat, or the default card shape. */
const panelWidth = (term?: Term) => (term?.media ? Math.round(208 * ratio(term.media)) + 10 : 327)

/**
 * The deliverables: a list where hovering a row floats its media beside the
 * pointer, or cards with the media under each term. Touch screens and phones
 * always get the cards.
 */
export function Terms({ intro, items, open }: { intro?: string; items: Term[]; open: (media: Media) => void }) {
  const touch = useTouch()
  const [cards, setCards] = useState(false)
  const showCards = touch || cards
  return (
    <div>
      <div className="flex items-start gap-25">
        <div className="min-w-0 flex-1">{intro && <p>{inline(intro, 'text-ink-strong')}</p>}</div>
        {!touch && (
          <div role="group" aria-label="How to show the deliverables" className="flex shrink-0 gap-3 rounded-[10px] bg-[#e2e2e2] p-4">
            <Switch on={!cards} glyph="list" label="Show them as a list" onClick={() => setCards(false)} />
            <Switch on={cards} glyph="cards" label="Show them as cards" onClick={() => setCards(true)} />
          </div>
        )}
      </div>
      {showCards ? <Cards items={items} open={open} /> : <List items={items} open={open} />}
    </div>
  )
}

function Switch({ on, glyph, label, onClick }: { on: boolean; glyph: GlyphName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className={`grid size-30 cursor-pointer place-items-center border-[0.75px] outline-none transition-[background,color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent ${
        on
          ? 'rounded-[10px] border-[#dfdfdf] bg-white text-ink-strong shadow-[0.5px_0.5px_1px_#0000000d]'
          : 'rounded-[6px] border-transparent text-body hover:text-ink'
      }`}
    >
      <PixelIcon name={glyph} pixel={2} />
    </button>
  )
}

function List({ items, open }: { items: Term[]; open: (media: Media) => void }) {
  const list = useRef<HTMLDListElement>(null)
  const [hot, setHot] = useState<number | null>(null)
  const [at, setAt] = useState({ x: 0, y: 0 })
  const width = panelWidth(hot === null ? undefined : items[hot])
  const shown = hot === null ? undefined : items[hot]

  return (
    <dl
      ref={list}
      onMouseLeave={() => setHot(null)}
      onMouseMove={(event) => {
        const box = list.current?.getBoundingClientRect()
        if (!box) return
        const room = window.innerWidth - event.clientX - 28 - 16
        setAt({ x: event.clientX - box.left + (room < width ? -(28 + width) : 28), y: event.clientY - box.top })
      }}
      className={`relative mt-40 flex flex-col gap-12 ${hot === null ? '' : 'cursor-pointer'}`}
    >
      {items.map((item, i) => {
        const on = hot === i
        return (
          <div
            key={item.term}
            onMouseEnter={() => setHot(i)}
            className={`relative flex flex-row items-baseline gap-14 transition-opacity duration-160 ease-out ${hot !== null && !on ? 'opacity-45' : ''}`}
          >
            {item.media && (
              <button
                type="button"
                aria-label={`Open ${item.term}`}
                onClick={() => open(item.media!)}
                className="absolute -inset-x-4 -inset-y-6 cursor-pointer rounded-[10px] outline-none focus-visible:outline-2 focus-visible:outline-accent"
              />
            )}
            <dt className={`shrink-0 whitespace-nowrap transition-colors duration-160 ease-out ${on ? 'text-accent' : 'text-ink-strong'}`}>{item.term}</dt>
            <dd className={`min-w-0 flex-1 transition-colors duration-160 ease-out ${on ? 'text-ink-strong' : 'text-body'}`}>{inline(item.body, 'text-ink-strong')}</dd>
            <span aria-hidden className="relative mr-6 mb-1 block h-22 w-32 shrink-0 self-end">
              <PixelIcon name="folder" pixel={2} className={`absolute bottom-0 left-0 transition-opacity duration-160 ease-out ${on ? 'opacity-0' : 'text-body'}`} />
              <PixelIcon name="openFolder" pixel={2} className={`absolute bottom-0 left-0 text-ink-strong transition-opacity duration-160 ease-out ${on ? '' : 'opacity-0'}`} />
            </span>
          </div>
        )
      })}
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 z-10 flex h-218 overflow-hidden rounded-[20px] transition-[opacity,transform] duration-160 ease-out ${
          shown?.media ? 'bg-white p-5 shadow-[3px_4px_12px_#00000026]' : 'bg-well'
        } ${shown ? 'translate-y-[-50%] opacity-100' : 'translate-y-[calc(6px-50%)] opacity-0'}`}
        style={{ left: at.x, top: at.y, width }}
      >
        {shown?.media && <Tile key={shown.term} media={shown.media} eager className="rounded-[15px]" />}
      </div>
    </dl>
  )
}

function Cards({ items, open }: { items: Term[]; open: (media: Media) => void }) {
  return (
    <div className="mt-40 grid grid-cols-2 gap-x-12 gap-y-32 sm:gap-x-26 sm:gap-y-44">
      {items.map((item) => (
        <div key={item.term} className="grid grid-rows-[auto_1fr_auto]">
          <p className="text-ink-strong">{item.term}</p>
          <p className="mt-14 text-body">{inline(item.body, 'text-ink-strong')}</p>
          {item.media ? (
            <button
              type="button"
              aria-label={item.media.alt || item.term}
              onClick={() => open(item.media!)}
              className="mt-16 flex aspect-[327/218] w-full cursor-pointer self-end overflow-hidden rounded-[20px] bg-white p-5 shadow-[3px_4px_12px_#00000026] outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              <Tile media={item.media} className="rounded-[15px]" />
            </button>
          ) : (
            <div aria-hidden className="mt-16 aspect-[327/218] w-full self-end rounded-[20px] bg-well" />
          )}
        </div>
      ))}
    </div>
  )
}
