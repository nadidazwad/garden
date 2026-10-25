import { mkdir, readFile, writeFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { CASES, casePage, head, HOME, siteFiles } from './src/meta/index.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), phoneGeometry(), meta()],
})

const HEAD = /<!-- head -->[\s\S]*?<!-- \/head -->/

/**
 * Writes the page's head (title, description, share card, icons, structured
 * data) from src/meta into index.html. The build also writes a copy of the page
 * per case study with that study's own head, which vercel.json serves at its
 * address, so a link to one previews as itself; and the sitemap, robots.txt and
 * manifest, which dev serves too.
 */
function meta(): Plugin {
  const files = siteFiles()
  let outDir = 'dist'
  let building = false
  return {
    name: 'meta',
    configResolved(config) {
      outDir = config.build.outDir
      building = config.command === 'build'
    },
    transformIndexHtml(html) {
      return html.replace('<!-- head -->', `<!-- head -->\n    ${head(HOME)}\n    <!-- /head -->`)
    },
    configureServer(server) {
      for (const [path, body] of Object.entries(files)) server.middlewares.use(path, (_, response) => response.end(body))
    },
    async closeBundle() {
      if (!building) return
      const page = await readFile(`${outDir}/index.html`, 'utf8')
      await mkdir(`${outDir}/share`, { recursive: true })
      for (const share of CASES) {
        const body = await readFile(new URL(`./src/portfolio/writing/${share.source}`, import.meta.url), 'utf8')
        const project = share.path.split('/')[2]
        const own = `<!-- head -->\n    ${head(casePage(share, body))}\n    <!-- /head -->`
        await writeFile(`${outDir}/share/${project}.html`, page.replace(HEAD, own))
      }
      for (const [path, body] of Object.entries(files)) await writeFile(`${outDir}${path}`, body)
    },
  }
}

/** Dev only: lets the phone layout editor (/__overview/phone) save what you place into phone.json. */
function phoneGeometry(): Plugin {
  const file = new URL('./src/portfolio/phone.json', import.meta.url)
  return {
    name: 'phone-geometry',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__overview/phone/save', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end()
          return
        }
        let body = ''
        request.on('data', (chunk) => (body += chunk))
        request.on('end', async () => {
          try {
            JSON.parse(body)
            await writeFile(file, body)
            response.end('saved')
          } catch (error) {
            response.statusCode = 400
            response.end(String(error))
          }
        })
      })
    },
  }
}
