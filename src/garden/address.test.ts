import { describe, expect, it } from 'vitest'
import { createGrove } from '../grove'
import { portfolio } from '../portfolio'
import { syncAddress, type Address } from './address.ts'

const ATTAR = '/work/attar/case-study.md'
const STABLECONVERSE = '/work/stableconverse/case-study.md'

/** History as the browser keeps it, minus the browser. A reload is a new grove on the same history. */
function memoryHistory(start = '/') {
  const entries = [{ path: start, stacked: false }]
  let at = 0
  const listeners = new Set<() => void>()
  const address: Address = {
    get path() {
      return entries[at].path
    },
    get stacked() {
      return entries[at].stacked
    },
    push(path) {
      entries.splice(++at, Infinity, { path, stacked: true })
    },
    replace(path) {
      entries[at] = { ...entries[at], path }
    },
    back() {
      if (at === 0) throw new Error('stepped back off the site')
      at--
      listeners.forEach((listener) => listener())
    },
    onPop(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  const visit = () => {
    const grove = createGrove(portfolio)
    syncAddress(grove, address)
    return grove
  }
  return { address, visit, paths: () => entries.map((entry) => entry.path), at: () => at }
}

describe('the address', () => {
  it('is / everywhere but a case study', () => {
    const history = memoryHistory()
    const grove = history.visit()
    grove.open('/work/attar')
    grove.open('/films')
    grove.open('/about.txt')
    expect(history.paths()).toEqual(['/'])

    grove.close('/about.txt')
    grove.open(ATTAR)
    expect(history.paths()).toEqual(['/', ATTAR])
  })

  it('lets a reload start the plant afresh, unless it lands on a case study', () => {
    const history = memoryHistory()
    history.visit().open('/films/book-carnival-2026')
    const reloaded = history.visit()
    expect(reloaded.location).toBe('/')
    expect(reloaded.isOpen('/films')).toBe(false)

    // An address from when folders had their own goes back to the start too.
    const old = memoryHistory('/films/book-carnival-2026/')
    expect(old.visit().location).toBe('/')
    expect(old.address.path).toBe('/')

    const reading = memoryHistory(ATTAR)
    const grove = reading.visit()
    expect(grove.location).toBe(ATTAR)
    expect(grove.isOpen('/work/attar')).toBe(true)
  })

  it('puts a case study down on Back, leaving the tree as it was', () => {
    const history = memoryHistory()
    const grove = history.visit()
    grove.open('/films')
    grove.open('/work/attar')
    grove.open(ATTAR)
    history.address.back()
    expect(grove.location).toBe('/work/attar')
    expect(grove.isOpen('/films')).toBe(true)
    expect(history.address.path).toBe('/')
  })

  it('steps back over a case study closed from its page, and swaps in the next one in place', () => {
    const history = memoryHistory()
    const grove = history.visit()
    grove.open(ATTAR)
    grove.go(STABLECONVERSE)
    expect(history.paths()).toEqual(['/', STABLECONVERSE])

    grove.close(STABLECONVERSE)
    expect(history.at()).toBe(0)
    expect(history.paths()).toEqual(['/', STABLECONVERSE])

    // Arriving straight on one, there is nothing of ours to step back to.
    const linked = memoryHistory(ATTAR)
    linked.visit().close(ATTAR)
    expect(linked.paths()).toEqual(['/'])
  })
})
