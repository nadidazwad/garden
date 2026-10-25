// How the site presents itself to everything outside it: the page's head
// (title, description, share card, icons, structured data), each case study's
// own share card, the tab titles, and the sitemap. The build writes the head
// into index.html and a copy per case study (see vite.config.ts); the garden
// uses the titles. Plain data and strings only, so the build can load it.
import { parseCase } from '../garden/case/parse.ts'

export const SITE = {
  url: 'https://azwad-three.vercel.app',
  name: 'Nadid Azwad',
  title: 'Nadid Azwad · Designer and engineer in Dhaka',
  description:
    'Designer and engineer in Dhaka. I make websites, products and short films. Right now I’m the founding design engineer at StableConverse, an AI sales agent for shops in Bangladesh.',
  image: { path: '/og/garden.png', type: 'image/png', alt: 'Nadid Azwad’s portfolio: his work as a file tree, growing as a dithered plant over his name' },
  email: 'nadidazwad@gmail.com',
  profiles: ['https://www.linkedin.com/in/nadidazwad/', 'https://github.com/nadidazwad'],
  color: '#ffffff',
}

export interface CaseShare {
  /** Where it lives in the tree, which is also its address. */
  path: string
  /** Its Markdown, in src/portfolio/writing/. */
  source: string
  /** Its share card, in public/. */
  image: string
}

/** The case studies, each with a share card of its own. `pnpm test` names any the tree has and this doesn't. */
export const CASES: CaseShare[] = [
  { path: '/work/quickhajj/case-study.md', source: 'case-quickhajj.md', image: '/og/quickhajj.jpg' },
  { path: '/work/attar/case-study.md', source: 'case-attar.md', image: '/og/attar.jpg' },
  { path: '/work/stableconverse/case-study.md', source: 'case-stableconverse.md', image: '/og/stableconverse.jpg' },
]

/** Markdown down to the words: emphasis and links dropped, the text kept. */
export function plain(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\W)_(.+?)_(?=\W|$)/g, '$1$2')
    .trim()
}

/** A case study as its share card and tab show it. */
export function caseMeta(body: string) {
  const doc = parseCase(body)
  return { kicker: doc.kicker ? plain(doc.kicker) : undefined, title: plain(doc.title), summary: doc.summary ? plain(doc.summary) : undefined }
}

/** What the tab says: the case study's title, or the site's. */
export function titleOf(caseBody?: string) {
  return caseBody ? `${caseMeta(caseBody).title} · ${SITE.name}` : SITE.title
}

export interface Page {
  path: string
  title: string
  description: string
  image: { path: string; type: string; alt: string }
  /** A case study, rather than the garden itself. */
  article?: { kicker?: string }
}

/** The garden's own page. */
export const HOME: Page = { path: '/', title: SITE.title, description: SITE.description, image: SITE.image }

/** At most `limit` characters: whole sentences if any fit, else whole words and an ellipsis. X cuts at 200. */
export function clip(text: string, limit = 200) {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const sentence = cut.lastIndexOf('. ')
  if (sentence > limit / 2) return cut.slice(0, sentence + 1)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

/** A case study's page, from its Markdown. */
export function casePage(share: CaseShare, body: string): Page {
  const { kicker, title, summary } = caseMeta(body)
  return {
    path: share.path,
    title: `${title} · ${SITE.name}`,
    description: clip(summary ?? SITE.description),
    image: { path: share.image, type: 'image/jpeg', alt: `${title}: a case study by ${SITE.name}` },
    article: { kicker },
  }
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const absolute = (path: string) => new URL(encodeURI(path), SITE.url).href

/** Everything the head says about a page, for browsers, search engines and link previews. */
export function head(page: Page) {
  const url = absolute(page.path)
  const image = absolute(page.image.path)
  const meta = (key: 'name' | 'property', name: string, content: string) => `<meta ${key}="${name}" content="${escape(content)}" />`
  const person = {
    '@type': 'Person',
    '@id': `${SITE.url}/#person`,
    name: SITE.name,
    url: `${SITE.url}/`,
    image: absolute('/icons/icon-512.png'),
    jobTitle: 'Designer and engineer',
    description: SITE.description,
    email: `mailto:${SITE.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
    worksFor: { '@type': 'Organization', name: 'StableConverse', url: 'https://stableconverse.com' },
    affiliation: { '@type': 'CollegeOrUniversity', name: 'North South University' },
    knowsAbout: ['Web design', 'Product design', 'Front-end engineering', 'Design engineering', 'Short films'],
    sameAs: SITE.profiles,
  }
  const website = { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.name, inLanguage: 'en', publisher: { '@id': person['@id'] } }
  const about = page.article
    ? {
        '@type': 'Article',
        '@id': `${url}#article`,
        url,
        headline: page.title.replace(` · ${SITE.name}`, ''),
        description: page.description,
        image,
        inLanguage: 'en',
        author: { '@id': person['@id'] },
        isPartOf: { '@id': website['@id'] },
      }
    : { '@type': 'ProfilePage', '@id': `${url}#page`, url, name: page.title, mainEntity: { '@id': person['@id'] }, isPartOf: { '@id': website['@id'] } }
  const graph = JSON.stringify({ '@context': 'https://schema.org', '@graph': [person, website, about] }).replace(/</g, '\\u003c')

  return [
    `<title>${escape(page.title)}</title>`,
    meta('name', 'description', page.description),
    meta('name', 'author', SITE.name),
    `<link rel="canonical" href="${url}" />`,
    // Link previews: Open Graph for most, Twitter's own names for X.
    meta('property', 'og:type', page.article ? 'article' : 'profile'),
    meta('property', 'og:site_name', SITE.name),
    meta('property', 'og:locale', 'en_GB'),
    meta('property', 'og:url', url),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:image', image),
    meta('property', 'og:image:secure_url', image),
    meta('property', 'og:image:type', page.image.type),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', page.image.alt),
    ...(page.article ? [meta('property', 'article:author', `${SITE.url}/`)] : [meta('property', 'profile:first_name', 'Nadid'), meta('property', 'profile:last_name', 'Azwad')]),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', image),
    meta('name', 'twitter:image:alt', page.image.alt),
    // Icons: the N in a circle, as SVG where it's understood, with sharp bitmaps for the rest.
    `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/site.webmanifest" />`,
    meta('name', 'application-name', SITE.name),
    meta('name', 'apple-mobile-web-app-title', 'Azwad'),
    meta('name', 'theme-color', SITE.color),
    meta('name', 'color-scheme', 'light'),
    meta('name', 'format-detection', 'telephone=no'),
    ...SITE.profiles.map((profile) => `<link rel="me" href="${profile}" />`),
    `<script type="application/ld+json">${graph}</script>`,
  ].join('\n    ')
}

/** Every address worth finding: the garden, and each case study. */
export function sitemap() {
  const urls = [HOME.path, ...CASES.map((share) => share.path)].map((path) => `  <url><loc>${absolute(path)}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

/** Lets crawlers in, keeps them off the dev tools' addresses, and points them at the sitemap. */
export function robots() {
  return `User-agent: *\nAllow: /\nDisallow: /__overview\n\nSitemap: ${SITE.url}/sitemap.xml\n`
}

/** For a home screen or an install: the name, the colours, and the N at every size it's asked for. */
export function manifest() {
  const icon = (src: string, sizes: string, purpose: string, type = 'image/png') => ({ src, sizes, type, purpose })
  return `${JSON.stringify(
    {
      name: SITE.name,
      short_name: 'Azwad',
      description: SITE.description,
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: SITE.color,
      theme_color: SITE.color,
      icons: [
        icon('/favicon.svg', 'any', 'any', 'image/svg+xml'),
        icon('/icons/icon-192.png', '192x192', 'any'),
        icon('/icons/icon-512.png', '512x512', 'any'),
        icon('/icons/icon-maskable-512.png', '512x512', 'maskable'),
      ],
    },
    null,
    2,
  )}\n`
}

/** The files the build writes beside the pages, by path. */
export function siteFiles(): Record<string, string> {
  return { '/sitemap.xml': sitemap(), '/robots.txt': robots(), '/site.webmanifest': manifest() }
}
