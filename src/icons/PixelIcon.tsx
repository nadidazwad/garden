import type { SVGProps } from 'react'
import { glyphs, type GlyphName } from './glyphs.ts'

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: GlyphName
  /** Size of one icon pixel in CSS px; defaults to the `--px` grid. */
  pixel?: number
}

export function PixelIcon({ name, pixel, style, ...rest }: Props) {
  const glyph = glyphs[name]
  const size = (n: number) => (pixel ? `${pixel * n}px` : `calc(var(--px) * ${n})`)
  return (
    <svg
      viewBox={`0 0 ${glyph.width} ${glyph.height}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
      style={{ width: size(glyph.width), height: size(glyph.height), ...style }}
    >
      <path d={glyph.fill} className="fill-page" />
      <path d={glyph.outline} />
      <path d={glyph.shadow} className="invisible group-hover:visible" />
    </svg>
  )
}
