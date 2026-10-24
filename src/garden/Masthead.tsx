import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ROOT_ID, type Grove, type Vec2 } from '../grove'
import { GROUND, INTRO, TIME } from '../portfolio'
import { usePinned } from './usePinned.ts'
import type { View } from './view.ts'

/** World px, so the words scale with the plant. */
const w = (n: number) => `calc(var(--spacing) * ${n})`

const NAME_SIZE = 212
/** How far the name shrinks, toward its bottom left corner, while a branch grows across where it stood. */
const TUCKED = 0.3
/** World px the tucked name rises by, so in the opening view it stands level with the hello folder in the opposite corner. */
const TUCKED_LIFT = 26
/** How far PP Mondwest's baseline sits below the top of a line as tall as the type. */
const BASELINE = 0.78
/** Where the name sits, in world px: from its left edge to the end of "Azwad", from the tops of its letters to the ground. */
const NAME = { minX: -404, maxX: 690, minY: GROUND - 0.75 * NAME_SIZE, maxY: GROUND }
/** Once less than this much of the name is on screen, the small one drops in at the top. */
const NAME_GONE = 0.5

interface Props {
  grove: Grove<unknown>
  view: View
  onContact: () => void
}

/**
 * The name, huge, standing on the ground the plant grows out of; the intro
 * and the time in opposite top corners. All three are set in the world, so
 * they pan with the plant. When a branch is about to grow across the
 * name, the name shrinks toward its bottom left corner to make room until the
 * branch goes, and once it leaves the screen a small one drops in at the
 * top left. While the visitor is off in the folders, the intro and the time
 * step back to grey; pointing at them brings their colours back.
 */
export function Masthead({ grove, view, onContact }: Props) {
  const crossing = useCrossing(grove)
  const away = grove.location !== ROOT_ID
  const name = useRef<HTMLHeadingElement>(null)
  const nameShows = useOnScreen(name, NAME_GONE)
  return (
    <>
      <SmallName shown={!nameShows} onClick={() => grove.go(ROOT_ID)} />
      <Pinned grove={grove} view={view} at={[NAME.minX, GROUND - BASELINE * NAME_SIZE]}>
        <h1
          ref={name}
          className="font-mondwest whitespace-nowrap text-ink transition-[scale,translate] duration-700 ease-out-expo"
          style={{
            fontSize: w(NAME_SIZE),
            lineHeight: w(NAME_SIZE),
            // About the left end of the baseline, so it stays standing on the ground.
            transformOrigin: `0 ${BASELINE * 100}%`,
            scale: crossing ? TUCKED : 1,
            translate: crossing ? `0 ${w(-TUCKED_LIFT)}` : '0 0',
          }}
        >
          Nadid Azwad
        </h1>
      </Pinned>
      <Pinned grove={grove} view={view} at={[INTRO.minX, INTRO.minY]}>
        <Intro grove={grove} quiet={away} onContact={onContact} />
      </Pinned>
      <Pinned grove={grove} view={view} at={[TIME.minX, TIME.minY]}>
        <Clock quiet={away} />
      </Pinned>
    </>
  )
}

/** True from the moment a folder whose branch, or anything on it, runs across the name opens, until it closes again. */
function useCrossing(grove: Grove<unknown>) {
  const crossers = useMemo(() => {
    const inside = ([x, y]: Vec2) => x > NAME.minX && x < NAME.maxX && y > NAME.minY - 20 && y < NAME.maxY
    const ids = new Set<string>()
    for (const branch of grove.layout.branches.values()) {
      if (branch.parent !== null && branch.path.points.some(inside)) ids.add(branch.id)
    }
    for (const node of grove.layout.nodes) if (inside(node.at)) ids.add(node.parent)
    ids.delete(grove.layout.rootId)
    return [...ids]
  }, [grove])
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

function Intro({ grove, quiet, onContact }: { grove: Grove<unknown>; quiet: boolean; onContact: () => void }) {
  const go = (path: string) => () => grove.go(path)
  return (
    <p
      className="pointer-events-auto text-body transition-colors duration-500"
      data-quiet={quiet ? '' : undefined}
      style={{ width: w(INTRO.maxX - INTRO.minX), fontSize: w(16), lineHeight: w(22) }}
    >
      Designer and engineer in Dhaka. I make <Phrase onClick={go('/work/')}>websites, products</Phrase> and{' '}
      <Phrase onClick={go('/films/')}>short films</Phrase>. Right now I’m the{' '}
      <Phrase onClick={go('/work/stableconverse/')}>founding design engineer</Phrase> at StableConverse, an AI sales
      agent for shops in Bangladesh. I’m also open to{' '}
      <Phrase onClick={onContact} accent>
        a few client projects a year
      </Phrase>
      .
    </p>
  )
}

function Phrase({ children, accent, onClick }: { children: ReactNode; accent?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline cursor-pointer text-left outline-none decoration-1 underline-offset-3 transition-colors duration-500 hover:text-accent hover:duration-150 hover:underline focus-visible:underline ${accent ? 'text-accent' : 'text-ink'}`}
    >
      {children}
    </button>
  )
}

const DHAKA = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true })

/** The time where I am, kept current. */
function Clock({ quiet }: { quiet: boolean }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(timer)
  }, [])
  return (
    <p
      className="pointer-events-auto whitespace-nowrap text-body transition-colors duration-500"
      data-quiet={quiet ? '' : undefined}
      style={{ fontSize: w(13), lineHeight: w(17) }}
    >
      It’s <time className="text-ink transition-colors duration-500">{DHAKA.format(now)}</time> in Dhaka.
    </p>
  )
}
