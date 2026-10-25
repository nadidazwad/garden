import { useEffect, useState } from 'react'
import { pixelGrid } from '../grove'
import { desktop, phone, type Layout } from '../portfolio'

/** Below this width (Tailwind's `sm`, so CSS can use `max-sm:`) the garden takes the phone layout. */
const NARROW = 640

export interface Viewport {
  width: number
  height: number
  dpr: number
  /** CSS px per world px. */
  scale: number
  /** One icon pixel / dither cell, in CSS px. */
  pixel: number
  narrow: boolean
  /** The layout drawn for this shape of screen. */
  layout: Layout
}

/** The plant fills the viewport, scaled to fit the view its layout is drawn for. */
export function useViewport() {
  const [viewport, setViewport] = useState(measure)
  useEffect(() => {
    const update = () => setViewport(measure())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return viewport
}

function measure(): Viewport {
  const width = window.innerWidth
  const height = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const narrow = width < NARROW
  const layout = narrow ? phone : desktop
  const { frame } = layout
  const scale = Math.min(frame.maxScale, Math.max(frame.minScale, Math.min(width / frame.width, height / frame.height)))
  return { width, height, dpr, scale, pixel: pixelGrid(scale, dpr).css, narrow, layout }
}
