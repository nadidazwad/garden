import { writeFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), phoneGeometry()],
})

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
