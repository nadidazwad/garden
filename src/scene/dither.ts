import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type Camera,
  type WebGLRenderer,
} from 'three'

// Sampled from the reference recording.
const PALETTE = [
  '#140d09', // black
  '#3b2620', // bark shadow
  '#6b4a33', // bark
  '#8e6a4a', // bark, lit
  '#b08d68', // bark highlight
  '#8f9a22', // olive
  '#5d9c12', // leaf shade
  '#36c21c', // green
  '#97f416', // lime
  '#c4f53c', // spring
  '#ecf622', // yellow
  '#eef5a6', // pale
  '#7c3416', // rust
  '#d9722a', // orange
  '#efa13a', // amber
  '#f4c64e', // gold
  '#d68a86', // blossom
  '#b22020', // berry
  '#5c1616', // maroon
]

/** Rendering at twice the cell resolution gives each cell 4 samples (×4 MSAA) of coverage. */
const SUPERSAMPLE = 2

/**
 * Draws a scene as a grid of flat-coloured cells. Coverage decides whether a
 * cell is drawn at all and colour snaps to the palette, both through a Bayer
 * matrix, which is what turns sub-cell twigs into dotted lines.
 *
 * The grid is locked to the world, not the screen: the scene is rendered from a
 * camera snapped to whole cells, then slid by the leftover device pixels. Pans
 * stay smooth and the dither pattern never crawls.
 */
export function createDither() {
  const target = new WebGLRenderTarget(1, 1, { samples: 4 })
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    defines: { PALETTE_SIZE: PALETTE.length },
    uniforms: {
      tScene: { value: target.texture },
      uCells: { value: new Vector2(1, 1) },
      uCell: { value: 1 },
      uHeight: { value: 1 },
      uShift: { value: new Vector2() },
      uOrigin: { value: new Vector2() },
      uPalette: { value: PALETTE.map(rgb) },
    },
    vertexShader: /* glsl */ `
      void main() {
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform vec2 uCells;
      uniform float uCell;
      uniform float uHeight;
      uniform vec2 uShift;
      uniform vec2 uOrigin;
      uniform vec3 uPalette[PALETTE_SIZE];

      float bayer2(vec2 a) {
        a = floor(a);
        return fract(dot(a, vec2(0.5, a.y * 0.75)));
      }

      float bayer4(vec2 a) {
        return bayer2(0.5 * a) * 0.25 + bayer2(a);
      }

      void main() {
        vec2 cell = floor((vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y) + uShift) / uCell);
        vec2 world = cell + uOrigin;
        // The centre of a cell sits on the corner of its 2×2 texels, so one
        // bilinear fetch averages them.
        vec4 texel = texture2D(tScene, vec2((cell.x + 0.5) / uCells.x, 1.0 - (cell.y + 0.5) / uCells.y));
        if (texel.a <= bayer4(world)) discard;

        vec3 color = texel.rgb / texel.a + (bayer4(world + vec2(2.0, 1.0)) - 0.5) * 0.22;
        vec3 best = uPalette[0];
        float nearest = 1e9;
        for (int i = 0; i < PALETTE_SIZE; i++) {
          vec3 d = (color - uPalette[i]) * vec3(1.0, 1.25, 0.8);
          float gap = dot(d, d);
          if (gap < nearest) {
            nearest = gap;
            best = uPalette[i];
          }
        }
        gl_FragColor = vec4(best, 1.0);
      }
    `,
  })
  const quad = new Mesh(new PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const screen = new Scene().add(quad)
  const screenCamera = new OrthographicCamera()

  return {
    /**
     * `cell` and `shift` are in device px. `origin` is the world cell under the
     * camera's top-left corner, mod 4, so the Bayer matrix stays on the world.
     */
    render(gl: WebGLRenderer, scene: Scene, camera: Camera, grid: { cells: Vector2; cell: number; shift: Vector2; origin: Vector2 }) {
      const { cells, cell, shift, origin } = grid
      const width = cells.x * SUPERSAMPLE
      const height = cells.y * SUPERSAMPLE
      if (target.width !== width || target.height !== height) target.setSize(width, height)
      material.uniforms.uCells.value.copy(cells)
      material.uniforms.uCell.value = cell
      material.uniforms.uShift.value.copy(shift)
      material.uniforms.uOrigin.value.copy(origin)
      material.uniforms.uHeight.value = gl.domElement.height

      gl.setClearColor(0x000000, 0)
      gl.setRenderTarget(target)
      gl.clear()
      gl.render(scene, camera)
      gl.setRenderTarget(null)
      gl.clear()
      gl.render(screen, screenCamera)
    },
    dispose() {
      target.dispose()
      material.dispose()
      quad.geometry.dispose()
    },
  }
}

/** Raw sRGB values: `Color` would convert them to linear. */
function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return new Vector3((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
