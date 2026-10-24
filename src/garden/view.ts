import type { Grove, Vec2 } from '../grove'

/** How the world maps onto the screen right now. */
export interface View {
  width: number
  height: number
  /** CSS px per world px. */
  scale: number
  dpr: number
}

/** Where a world point is on screen, rounded to whole device pixels like the plant; by default, with the camera where it is now. */
export function toScreen(grove: Grove<unknown>, { width, height, scale, dpr }: View, [x, y]: Vec2, [cx, cy] = grove.camera): Vec2 {
  return [Math.round(((x - cx) * scale + width / 2) * dpr) / dpr, Math.round(((y - cy) * scale + height / 2) * dpr) / dpr]
}
