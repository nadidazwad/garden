import { useEffect, useRef, type RefObject } from 'react'

/** Room left under the bar when it settles at the bottom of the page. */
export const TAIL = 96

export const PILL =
  'pointer-events-auto inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[18px] border border-line bg-page text-small leading-[21px] text-ink-strong shadow-[1px_1px_2px_#0000001a] outline-none transition-[color,scale,box-shadow] duration-150 ease-out hover:text-accent active:scale-[0.94] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent'

/**
 * The close and next pills. They ride at the top while you read, then glide down
 * to the bottom of the screen as the page runs out, so "Next" is under your thumb
 * at the end. Leaving the last 340px puts them back.
 */
export function Bar({ scroller, onClose, onNext }: { scroller: RefObject<HTMLDivElement | null>; onClose: () => void; onNext: () => void }) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const page = scroller.current
    if (!page) return
    let down = false
    const update = () => {
      const end = page.scrollHeight - page.clientHeight
      const left = end - page.scrollTop
      if (end <= 200) down = false
      else if (!down && left <= 200) down = true
      else if (down && left >= 340) down = false
      bar.current?.style.setProperty('--case-at', down ? '1' : '0')
    }
    update()
    page.addEventListener('scroll', update, { passive: true })
    const resize = new ResizeObserver(update)
    resize.observe(page)
    return () => {
      page.removeEventListener('scroll', update)
      resize.disconnect()
    }
  }, [scroller])

  return (
    <div
      ref={bar}
      className="pointer-events-none sticky top-0 z-30 mx-auto flex w-full max-w-1278 items-center justify-between px-24 pt-32 transition-transform duration-560 ease-glide will-change-transform motion-reduce:transition-none sm:px-60 sm:pt-60"
      style={{ transform: `translateY(calc(var(--case-at, 0) * (100dvh - ${TAIL}px - 100%)))` }}
    >
      <button type="button" onClick={onClose} aria-label="Back to the tree" className={`${PILL} group px-7 py-5`}>
        <Cross size={21} />
      </button>
      <button type="button" onClick={onNext} className={`${PILL} px-13 py-5`}>
        Next
      </button>
    </div>
  )
}

/**
 * The case study's close mark: two drawn strokes, not a pixel glyph. The page is
 * white paper over the plant, so it takes the paper's smooth lines. Hovering
 * its button turns it a quarter, as if unscrewing.
 */
export function Cross({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 21 21"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      className="block transition-[rotate] duration-300 ease-out-expo motion-safe:group-hover:rotate-90"
    >
      <path d="M6.5 6.5l8 8M14.5 6.5l-8 8" />
    </svg>
  )
}
