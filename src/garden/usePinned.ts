import { useLayoutEffect, useRef } from 'react'
import type { Grove, Vec2 } from '../grove'
import { toScreen, type View } from './view.ts'

/** How long an element takes to glide between following the plant and staying put. */
const GLIDE = 700

/**
 * Pins an element's top-left corner to a world point, moving it in the same
 * frame as the plant. With `stay`, it holds where it sits in the opening view
 * instead, whatever the camera does; switching between the two glides.
 */
export function usePinned<E extends HTMLElement>(grove: Grove<unknown>, view: View, [x, y]: Vec2, { stay = false } = {}) {
  const ref = useRef<E>(null)
  const stayed = useRef(stay)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    let settle: number | undefined
    if (stayed.current !== stay) {
      stayed.current = stay
      if (!grove.still) {
        element.style.transition = `transform ${GLIDE}ms var(--ease-out-expo)`
        settle = window.setTimeout(() => (element.style.transition = ''), GLIDE)
      }
    }
    const place = () => {
      const [left, top] = toScreen(grove, view, [x, y], stay ? grove.home : grove.camera)
      element.style.transform = `translate3d(${left}px, ${top}px, 0)`
    }
    place()
    const unsubscribe = grove.onFrame(place)
    return () => {
      unsubscribe()
      window.clearTimeout(settle)
      element.style.transition = ''
    }
  }, [grove, view, x, y, stay])
  return ref
}
