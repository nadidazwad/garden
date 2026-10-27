import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { CASES, casePage, caseWords, head, HOME, homeWords, siteFiles } from './src/meta/index.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), phoneGeometry(), meta()],
})

const HEAD = /<!-- head -->[\s\S]*?<!-- \/head -->/
const WORDS = /<!-- words -->[\s\S]*?<!-- \/words -->/

/** A file in src/portfolio/writing/. A declaration, so the plugins above can call it. */
function writing(source: string) {
  return readFileSync(new URL(`./src/portfolio/writing/${source}`, import.meta.url), 'utf8')
}

/**
 * Writes the page's head (title, description, share card, icons, structured
 * data) and its words from src/meta into index.html. The build also writes a
 * copy of the page per case study with that study's own head and words, which
 * vercel.json serves at its address, so a link to one previews and reads as
 * itself; and the sitemap, robots.txt and manifest, which dev serves too.
 */
function meta(): Plugin {
  const files = siteFiles()
  const cases = CASES.map((share) => ({ share, body: writing(share.source) }))
  let outDir = 'dist'
  let building = false
  return {
    name: 'meta',
    configResolved(config) {
      outDir = config.build.outDir
      building = config.command === 'build'
    },
    transformIndexHtml(html) {
      return html
        .replace('<!-- head -->', `<!-- head -->\n    ${head(HOME)}\n    <!-- /head -->`)
        .replace('<!-- words -->', () => `<!-- words -->\n${homeWords(writing('about.md'), cases)}\n<!-- /words -->`)
    },
    configureServer(server) {
      for (const [path, body] of Object.entries(files)) server.middlewares.use(path, (_, response) => response.end(body))
    },
    async closeBundle() {
      if (!building) return
      const page = await readFile(`${outDir}/index.html`, 'utf8')
      await mkdir(`${outDir}/share`, { recursive: true })
      for (const { share, body } of cases) {
        const project = share.path.split('/')[2]
        const own = `<!-- head -->\n    ${head(casePage(share, body))}\n    <!-- /head -->`
        const words = `<!-- words -->\n${caseWords(body)}\n<!-- /words -->`
        await writeFile(`${outDir}/share/${project}.html`, page.replace(HEAD, () => own).replace(WORDS, () => words))
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
