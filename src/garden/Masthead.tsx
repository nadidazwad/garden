import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ROOT_ID, type Bounds, type Grove, type Vec2 } from '../grove'
import type { Layout } from '../portfolio'
import { usePinned } from './usePinned.ts'
import type { View } from './view.ts'

/** World px, so the words scale with the plant. */
const w = (n: number) => `calc(var(--spacing) * ${n})`

/** How far the name shrinks, toward its bottom left corner, while a branch grows across where it stood. */
const TUCKED = 0.3
/** World px the tucked name rises by, so in the opening view it stands level with the hello folder in the opposite corner. */
const TUCKED_LIFT = 26
/** How far PP Mondwest's baseline sits below the top of a line as tall as the type. */
const BASELINE = 0.78
/** Baseline to baseline when the name stacks, in ems: just enough for "Azwad" to clear "Nadid". */
const LEADING = 0.84
/** Once less than this much of the name is on screen, the small one drops in at the top. */
const NAME_GONE = 0.5

interface Props {
  grove: Grove<unknown>
  view: View
  /** Where the layout puts the name, the intro and the time. */
  masthead: Layout['masthead']
  /** Whether the hello folder is open, which the last phrase of the intro toggles. */
  contact: boolean
  onContact: (open: boolean) => void
}

/**
 * The name, huge, standing on the ground the plant grows out of, on one line
 * or stacked onto two; the intro and the time wherever the layout puts them.
 * All three are set in the world, so they pan with the plant. When a branch
 * is about to grow across the name, the name shrinks toward its bottom left
 * corner to make room until the branch goes, and once it leaves the screen a
 * small one drops in at the top left. While the visitor is off in the folders,
 * the intro and the time step back to grey; pointing at them brings their
 * colours back.
 */
export function Masthead({ grove, view, masthead, contact, onContact }: Props) {
  const { name: title, intro, time } = masthead
  const crossing = useCrossing(grove, title.box)
  const away = grove.location !== ROOT_ID
  const name = useRef<HTMLHeadingElement>(null)
  const nameShows = useOnScreen(name, NAME_GONE)
  const { size, stacked } = title
  // From the top of the name to the baseline it stands on.
  const baseline = BASELINE * size + (stacked ? LEADING * size : 0)
  return (
    <>
      <SmallName shown={!nameShows} onClick={() => grove.go(ROOT_ID)} />
      <Pinned grove={grove} view={view} at={[title.box.minX, title.box.maxY - baseline]}>
        <h1
          ref={name}
          className="font-mondwest whitespace-nowrap text-ink transition-[scale,translate] duration-700 ease-out-expo"
          style={{
            fontSize: w(size),
            lineHeight: w(size),
            // About the left end of the baseline, so it stays standing on the ground.
            transformOrigin: `0 ${w(baseline)}`,
            scale: crossing ? TUCKED : 1,
            translate: crossing ? `0 ${w(-TUCKED_LIFT)}` : '0 0',
          }}
        >
          {stacked ? (
            <>
              <span className="block">Nadid</span>{' '}
              <span className="block" style={{ marginTop: w((LEADING - 1) * size) }}>
                Azwad
              </span>
            </>
          ) : (
            'Nadid Azwad'
          )}
        </h1>
      </Pinned>
      <Pinned grove={grove} view={view} at={[intro.box.minX, intro.box.minY]}>
        <Intro grove={grove} words={intro} quiet={away} contact={contact} onContact={onContact} />
      </Pinned>
      <Pinned grove={grove} view={view} at={[time.box.minX, time.box.minY]}>
        <Clock words={time} quiet={away} />
      </Pinned>
    </>
  )
}

/** True from the moment a folder whose branch, or anything on it, runs across `box` opens, until it closes again. */
function useCrossing(grove: Grove<unknown>, box: Bounds) {
  const crossers = useMemo(() => {
    const inside = ([x, y]: Vec2) => x > box.minX && x < box.maxX && y > box.minY - 20 && y < box.maxY
    const ids = new Set<string>()
    for (const branch of grove.layout.branches.values()) {
      if (branch.parent !== null && branch.path.points.some(inside)) ids.add(branch.id)
    }
    for (const node of grove.layout.nodes) if (inside(node.at)) ids.add(node.parent)
    ids.delete(grove.layout.rootId)
    return [...ids]
  }, [grove, box])
  return crossers.some((id) => grove.isOpen(id))
}

/** True while at least `share` of the element is on screen. */
function useOnScreen(ref: RefObject<Element | null>, share: number) {
  const [shows, setShows] = useState(true)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setShows(entry.intersectionRatio >= share), { threshold: share })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, share])
  return shows
}

/** The name, small, pinned to the top left corner while the big one is out of sight; it takes you back to the start. */
function SmallName({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      inert={!shown}
      aria-hidden={!shown}
      className={`halo font-mondwest pointer-events-auto fixed left-[30px] top-[22px] z-10 cursor-pointer whitespace-nowrap text-[30px] leading-[34px] text-ink outline-none transition-[translate,opacity,color] hover:text-accent focus-visible:text-accent motion-reduce:translate-y-0 ${
        shown ? 'translate-y-0 opacity-100 duration-500 ease-out-expo' : '-translate-y-[56px] opacity-0 duration-200 ease-in'
      }`}
    >
      Nadid Azwad
    </button>
  )
}

interface PinnedProps {
  grove: Grove<unknown>
  view: View
  at: Vec2
  children: ReactNode
}

function Pinned({ grove, view, at, children }: PinnedProps) {
  const ref = usePinned<HTMLDivElement>(grove, view, at)
  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 select-none">
      {children}
    </div>
  )
}

type Words = Layout['masthead']['intro']

interface IntroProps {
  grove: Grove<unknown>
  words: Words
  quiet: boolean
  contact: boolean
  onContact: (open: boolean) => void
}

/**
 * The intro's phrases each open a part of the plant, and a second click closes
 * it again: the whole branch the phrase opened, back to how the plant stood.
 */
function Intro({ grove, words, quiet, contact, onContact }: IntroProps) {
  const opens = (path: string) => {
    const id = path.replace(/\/+$/, '')
    const open = grove.isExpanded(id)
    return { open, onClick: () => (open ? grove.close(`/${id.split('/')[1]}`) : grove.go(path)) }
  }
  return (
    <p
      className="pointer-events-auto text-body transition-colors duration-500"
      data-quiet={quiet ? '' : undefined}
      style={{ width: w(words.box.maxX - words.box.minX), fontSize: w(words.size), lineHeight: w(words.leading) }}
    >
      Designer and engineer in Dhaka. I make <Phrase {...opens('/work/')}>websites, products</Phrase> and{' '}
      <Phrase {...opens('/films/')}>short films</Phrase>. Right now I’m the{' '}
      <Phrase {...opens('/work/stableconverse/')}>founding design engineer</Phrase> at StableConverse, an AI sales
      agent for shops in Bangladesh. I’m also open to{' '}
      {/* Marked so the hello folder's click-away doesn't shut it just before this click would. */}
      <Phrase open={contact} onClick={() => onContact(!contact)} accent contact>
        a few client projects a year
      </Phrase>
      .
    </p>
  )
}

interface PhraseProps {
  children: ReactNode
  /** What it opens is open: the line stays drawn under it until it's closed. */
  open: boolean
  accent?: boolean
  /** It toggles the hello folder. */
  contact?: boolean
  onClick: () => void
}

function Phrase({ children, open, accent, contact, onClick }: PhraseProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      data-contact-toggle={contact ? '' : undefined}
      onClick={onClick}
      // The line draws in under the phrase from its first word, and across a line break if it wraps.
      className={`line-draw inline cursor-pointer text-left outline-none [--line-fade:500ms] hover:text-accent hover:line-drawn hover:[--line-fade:150ms] focus-visible:line-drawn ${open ? 'line-drawn' : ''} ${accent ? 'text-accent' : 'text-ink'}`}
    >
      {children}
    </button>
  )
}

const DHAKA = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true })

/** The time where I am, kept current. */
function Clock({ words, quiet }: { words: Words; quiet: boolean }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(timer)
  }, [])
  const time = DHAKA.format(now)
  return (
    <p
      className="pointer-events-auto whitespace-nowrap text-body transition-colors duration-500"
      data-quiet={quiet ? '' : undefined}
      style={{ fontSize: w(words.size), lineHeight: w(words.leading) }}
    >
      It’s{' '}
      {/* A new minute rolls up into place. */}
      <time key={time} className="inline-block text-ink transition-colors duration-500 motion-safe:animate-roll">
        {time}
      </time>{' '}
      in Dhaka.
    </p>
  )
}
