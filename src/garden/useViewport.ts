import { useEffect, useState } from 'react'
import { pixelGrid } from '../grove'

export interface Viewport {
  width: number
  height: number
  dpr: number
  /** CSS px per world px. */
  scale: number
  /** One icon pixel / dither cell, in CSS px. */
  pixel: number
}

/** The plant fills the viewport; it grows a little on big screens. */
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
  const scale = Math.min(1.3, Math.max(0.85, Math.min(width / 1280, height / 800)))
  return { width, height, dpr, scale, pixel: pixelGrid(scale, dpr).css }
}
