/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { EntrySpec } from '../grove'
import { portfolio, type Entry } from '../portfolio'
import { CASES, caseWords, plain } from '.'

/** Every case study in the tree, by its path. */
function casesIn(children: EntrySpec<Entry>[] = portfolio.children, at = ''): { path: string; body: string }[] {
  return children.flatMap((child) => {
    const path = `${at}/${child.name}`
    if (child.data?.kind === 'case') return [{ path, body: child.data.body }]
    return 'children' in child ? casesIn(child.children, path) : []
  })
}

describe('share cards', () => {
  it('gives every case study in the tree its own card, at an address vercel.json serves it from', () => {
    const tree = casesIn()
    expect(CASES.map((share) => share.path).sort()).toEqual(tree.map((study) => study.path).sort())
    const rewrites: { source: string; destination: string }[] = JSON.parse(readFileSync('vercel.json', 'utf8')).rewrites
    for (const study of tree) {
      const share = CASES.find((each) => each.path === study.path)!
      expect(readFileSync(`src/portfolio/writing/${share.source}`, 'utf8')).toBe(study.body)
      expect(existsSync(`public${share.image}`), `public${share.image}: run tools/brand/og.mjs`).toBe(true)
      // The build writes share/<project>.html; the first rewrite serves it at the case study's own address.
      expect(study.path).toMatch(/^\/work\/[^/]+\/case-study\.md$/)
      expect(rewrites[0]).toEqual({ source: '/work/:project/case-study.md', destination: '/share/:project.html' })
    }
  })
})

describe('words', () => {
  it('gives readers that skip the script every line a case study says, all but its pictures', () => {
    for (const study of casesIn()) {
      const words = caseWords(study.body)
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
      const prose = study.body
        .replace(/^:::\w+$[\s\S]*?^:::$/gm, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .split(/\n|\|/)
        .map((line) => plain(line.replace(/^\s*(#+|-|>)\s*/, '')))
        .filter(Boolean)
      for (const line of prose) expect(words).toContain(line)
    }
  })
})
