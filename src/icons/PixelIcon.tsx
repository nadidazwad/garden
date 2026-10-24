import { glyphs, type GlyphName } from './glyphs.ts'

interface Props {
  name: GlyphName
  /** Size of one icon pixel in CSS px; defaults to the `--px` grid. */
  pixel?: number
  className?: string
}

export function PixelIcon({ name, pixel, className }: Props) {
  const glyph = glyphs[name]
  const size = (n: number) => (pixel ? `${pixel * n}px` : `calc(var(--px) * ${n})`)
  return (
    <svg
      className={className}
      style={{ width: size(glyph.width), height: size(glyph.height) }}
      viewBox={`0 0 ${glyph.width} ${glyph.height}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={glyph.outline} />
      <path d={glyph.shadow} className="invisible group-hover:visible" />
    </svg>
  )
}
