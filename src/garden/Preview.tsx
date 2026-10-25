import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import type { GroveNode } from '../grove'
import { PixelIcon, type GlyphName } from '../icons'
import { aspect, filmUrl, posterUrl, type Entry } from '../portfolio'
import { sound } from '../sound'
import { Markdown, type MarkdownStyle } from './Markdown.tsx'
import { playWithSound } from './film.ts'
import { Placeholder, Still } from './Media.tsx'

interface Props {
  node: GroveNode<Entry>
  width: number
  height: number
  /** On a phone the panel takes the whole width, bar a margin. */
  narrow: boolean
  /** The location has moved on: shrink back into the file, then call `onGone`. */
  leaving: boolean
  onClose: () => void
  onGone: () => void
}

// The same overshoot as a folder popping in, stretched over a longer move.
const GROW = 'cubic-bezier(0.2, 0.9, 0.25, 1)'
const SHRINK = 'cubic-bezier(0.5, 0, 0.75, 0)'

/**
 * A file, opened over the plant. It grows out of the glyph you clicked and
 * shrinks back into it, so you never lose your place in the tree. One at a time;
 * the plant stays put behind it, with no dimming.
 */
export function Preview({ node, width, height, narrow, leaving, onClose, onGone }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const entry = node.data
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    const element = panel.current
    if (!element || reduced) return
    const start = fromGlyph(element.getBoundingClientRect(), glyphRect(node.id))
    element.animate([start, { offset: 0.62, transform: 'scale(1.018)', opacity: 1 }, { transform: 'none', opacity: 1 }], {
      duration: 560,
      easing: GROW,
    })
  }, [node.id, reduced])

  useEffect(() => {
    const element = panel.current
    if (!leaving || !element) return
    if (reduced) return onGone()
    const end = fromGlyph(element.getBoundingClientRect(), glyphRect(node.id))
    const shrink = element.animate([{ transform: 'none', opacity: 1 }, end], { duration: 240, easing: SHRINK, fill: 'forwards' })
    shrink.finished.then(onGone, onGone)
  }, [leaving, node.id, onGone, reduced])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!entry || !(entry.kind === 'image' || entry.kind === 'video' || entry.kind === 'text')) return null
  const name = node.name

  const outside = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  // Media fills as much of the screen as it can at its own shape; words get a reading measure.
  const chrome = 132
  let frame = { width: narrow ? width - 32 : Math.min(560, width - 48), height: 0 }
  if (entry.kind !== 'text') {
    const ratio = aspect(node.id)
    const maxWidth = narrow ? width - 32 : Math.min(width * 0.74, 1180)
    const maxHeight = height * 0.86 - chrome
    frame = { width: maxWidth, height: maxWidth / ratio }
    if (frame.height > maxHeight) frame = { width: maxHeight * ratio, height: maxHeight }
  }

  return (
    <div
      className={`fixed inset-0 z-20 flex items-center justify-center ${leaving ? 'pointer-events-none' : ''}`}
      onPointerDown={outside}
    >
      <div
        ref={panel}
        role="dialog"
        aria-label={name}
        className="flex max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[6px] bg-panel shadow-[0_16px_34px_-16px_#16130f45,0_0_0_1px_#16130f12]"
        style={{ width: Math.max(frame.width, 300) }}
      >
        <TitleBar glyph={entry.kind === 'image' ? 'picture' : entry.kind === 'video' ? 'film' : 'text'} name={name} onClose={onClose} />
        {entry.kind === 'image' && <Still path={node.id} alt={entry.alt} style={{ width: frame.width, height: frame.height }} />}
        {entry.kind === 'video' && <Film path={node.id} width={frame.width} height={frame.height} />}
        {entry.kind === 'text' ? (
          <div className="max-h-[min(72vh,640px)] overflow-y-auto px-24 pb-24 pt-6">
            <div className={reduced ? '' : 'animate-roll [animation-delay:180ms]'}>
              <Markdown source={entry.body} styles={TEXT} />
            </div>
          </div>
        ) : (
          // The words follow the panel out of the file, a beat behind it.
          <div className="flex flex-col gap-2 px-16 pb-14 pt-12">
            <p className={`text-copy-tight text-ink ${reduced ? '' : 'animate-roll [animation-delay:200ms]'}`}>{entry.caption}</p>
            <p className={`flex flex-wrap gap-x-12 text-meta text-muted ${reduced ? '' : 'animate-roll [animation-delay:260ms]'}`}>
              {entry.meta && <span>{entry.meta}</span>}
              {(entry.kind === 'image' || entry.kind === 'video') && entry.link && (
                <a href={entry.link.href} target="_blank" rel="noreferrer" className="group text-accent">
                  <span className="line-draw group-hover:line-drawn group-focus-visible:line-drawn">{entry.link.label}</span>{' '}
                  <span className="inline-block transition-[translate] duration-200 ease-out group-hover:translate-x-2 group-hover:-translate-y-2">↗</span>
                </a>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const TEXT: MarkdownStyle = {
  heading: { 1: 'mb-12 text-heading text-ink', 2: 'mt-20 mb-8 text-lead text-ink', 3: 'mt-16 text-copy text-ink' },
  paragraph: 'mt-14 text-copy text-body first:mt-0',
  list: 'mt-14 flex flex-col gap-4 text-copy text-body',
  figure: 'mt-18',
  caption: 'mt-6 text-meta text-muted',
}

function TitleBar({ glyph, name, onClose }: { glyph: GlyphName; name: string; onClose: () => void }) {
  return (
    <div className="flex h-40 shrink-0 items-center justify-between gap-12 pl-14 pr-8">
      <span className="flex min-w-0 items-center gap-8 text-small text-ink">
        <PixelIcon name={glyph} pixel={1.5} className="shrink-0 text-muted" />
        <span className="truncate">{name}</span>
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="group flex size-28 cursor-pointer items-center justify-center rounded-[4px] max-sm:size-36 text-muted outline-none transition-[background-color,color] duration-150 ease-out hover:bg-plate hover:text-accent focus-visible:text-accent"
      >
        <PixelIcon name="close" pixel={1.5} />
      </button>
    </div>
  )
}

/**
 * Films start playing, looping, with their sound, as soon as they open. If the
 * browser won't let them make a sound yet, they play muted and sound is one click away.
 */
function Film({ path, width, height }: { path: string; width: number; height: number }) {
  const video = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(false)
  const [missing, setMissing] = useState(false)
  useEffect(() => playWithSound(video.current, () => setMuted(true)), [missing])
  const toggle = () => {
    const element = video.current
    if (!element) return
    sound.play(element.muted ? 'toggleOn' : 'toggleOff')
    element.muted = !element.muted
    if (!element.muted) sound.hush()
    setMuted(element.muted)
  }
  if (missing) return <Placeholder glyph="film" label={path} style={{ width, height }} />
  return (
    <div className="relative bg-ink" style={{ width, height }}>
      <video
        ref={video}
        src={filmUrl(path)}
        onError={() => setMissing(true)}
        poster={posterUrl(path)}
        loop
        playsInline
        className="block size-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-10 right-10 cursor-pointer overflow-hidden rounded-[4px] bg-ink/60 px-8 font-bit text-[18px] leading-[26px] text-white outline-none backdrop-blur-sm transition-[background-color,scale] duration-150 ease-out hover:bg-accent focus-visible:bg-accent active:scale-[0.94]"
      >
        <span key={muted ? 'on' : 'off'} className="inline-block motion-safe:animate-roll">
          {muted ? 'sound on' : 'sound off'}
        </span>
      </button>
    </div>
  )
}

function glyphRect(id: string) {
  return document.querySelector(`[data-glyph="${CSS.escape(id)}"]`)?.getBoundingClientRect() ?? null
}

/** A transform that puts the panel back inside the glyph it came out of. */
function fromGlyph(panel: DOMRect, glyph: DOMRect | null): Keyframe {
  if (!glyph || glyph.width === 0) return { transform: 'scale(0.92)', opacity: 0 }
  const dx = glyph.left + glyph.width / 2 - (panel.left + panel.width / 2)
  const dy = glyph.top + glyph.height / 2 - (panel.top + panel.height / 2)
  const scale = Math.max(glyph.width / panel.width, 0.02)
  return { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.3 }
}
