import { useLayoutEffect, useRef, useState } from 'react'
import { sound } from '../../sound'
import { inline } from '../Markdown.tsx'
import type { Stat, Thread } from './parse.ts'

/** Thread cards: a numbered line each, opening in place to the reasoning behind it. */
export function Threads({ items }: { items: Thread[] }) {
  return (
    <ul className="mt-30 grid w-full grid-cols-1 gap-15 first:mt-0">
      {items.map((thread, i) => (
        <ThreadCard key={i} n={i + 1} thread={thread} />
      ))}
    </ul>
  )
}

function ThreadCard({ n, thread }: { n: number; thread: Thread }) {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(0)
  const inner = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => setHeight(open ? (inner.current?.offsetHeight ?? 0) : 0), [open])

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          sound.play(open ? 'fold' : 'unfold')
          setOpen(!open)
        }}
        className={`group relative block w-full cursor-pointer rounded-[40px] border p-25 text-left outline-none transition-[border-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent active:scale-[0.99] ${
          open ? 'border-faint' : 'border-rule hover:border-faint'
        }`}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[40px] bg-plate opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100" />
        <span className="relative flex items-start gap-10">
          <span className="flex min-w-0 flex-1 flex-wrap gap-x-8 text-ink-strong">
            <span>Thread#{n}</span>
            <span>{inline(thread.title, 'text-ink-strong')}</span>
          </span>
          <span
            className={`shrink-0 text-body ${open ? 'opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100' : ''}`}
          >
            <span key={open ? 'less' : 'more'} className="inline-block motion-safe:animate-roll">
              {open ? 'less' : 'more'}
            </span>
          </span>
        </span>
        <span
          className="relative block overflow-hidden transition-[height] duration-320 ease-out-expo motion-reduce:transition-none"
          style={{ height }}
        >
          {/* The reasoning surfaces as the card opens, and sinks back as it shuts. */}
          <span
            ref={inner}
            className={`block pt-12 text-body transition-[opacity,translate,filter] motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100 blur-none delay-60 duration-360 ease-out-expo' : '-translate-y-4 opacity-0 blur-[2px] duration-160 ease-in'
            }`}
          >
            {inline(thread.body, 'text-ink-strong')}
          </span>
        </span>
      </button>
    </li>
  )
}

/** Number cards: a figure, what it counts, and a line on where it comes from. */
export function Stats({ items }: { items: Stat[] }) {
  return (
    <ul className="mx-auto mt-35 grid w-full max-w-798 gap-30 sm:grid-cols-3">
      {items.map((stat) => (
        <li key={stat.value + stat.label} className="flex items-center gap-18 rounded-[40px] border border-rule px-22 py-16 sm:block sm:p-25">
          <span className="block shrink-0">
            <span className="block text-[23px] leading-[26px] text-ink-strong">{stat.value}</span>
            <span className="block text-ink-strong">{stat.label}</span>
          </span>
          <span className="block min-w-0 flex-1 text-small text-body sm:mt-12 sm:text-copy-tight">{inline(stat.body, 'text-ink-strong')}</span>
        </li>
      ))}
    </ul>
  )
}
