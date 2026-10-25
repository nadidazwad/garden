import { describe, expect, it } from 'vitest'
import { gallery, parseCase } from './parse.ts'

const source = `
Designer @ Shop · 2026

# A **title**

The summary, with **a phrase**.

![The hero](/work/shop/hero.mp4)

## Deliverables

What I made:

- **Storefront** The shop itself. ![The storefront](/work/shop/front.png)
- **Guides** How to deploy it.

## Problem.

It was hard.

> **Thread one:** The first reason.
> **Thread two:** The second.

:::compare
Home: ![Before](/work/shop/a.png) ![After](/work/shop/b.png)
:::

##

| 95 | Lighthouse. | On phones. |

:::strip
![One](/work/shop/1.png) ![Two](/work/shop/2.mp4)
:::
`

describe('a case study', () => {
  it('reads the kicker, title, summary and hero before the first section', () => {
    const doc = parseCase(source)
    expect(doc.kicker).toBe('Designer @ Shop · 2026')
    expect(doc.title).toBe('A **title**')
    expect(doc.summary).toBe('The summary, with **a phrase**.')
    expect(doc.hero).toEqual([[{ alt: 'The hero', src: '/work/shop/hero.mp4' }]])
  })

  it('turns each section into the reference template’s parts', () => {
    const doc = parseCase(source)
    expect(doc.sections.map((section) => section.label)).toEqual(['Deliverables', 'Problem.', undefined])
    expect(doc.sections[0].blocks).toEqual([
      {
        kind: 'terms',
        intro: 'What I made:',
        items: [
          { term: 'Storefront', body: 'The shop itself.', media: { alt: 'The storefront', src: '/work/shop/front.png' } },
          { term: 'Guides', body: 'How to deploy it.', media: undefined },
        ],
      },
    ])
    expect(doc.sections[1].blocks.map((block) => block.kind)).toEqual(['text', 'threads', 'compare'])
    expect(doc.sections[1].blocks[1]).toEqual({
      kind: 'threads',
      items: [
        { title: 'Thread one:', body: 'The first reason.' },
        { title: 'Thread two:', body: 'The second.' },
      ],
    })
    expect(doc.sections[1].blocks[2]).toMatchObject({ kind: 'compare', pairs: [{ tab: 'Home', before: { alt: 'Before' }, after: { alt: 'After' } }] })
    expect(doc.sections[2].blocks[0]).toEqual({ kind: 'stats', items: [{ value: '95', label: 'Lighthouse.', body: 'On phones.' }] })
    expect(gallery(doc).map((media) => media.alt)).toEqual(['The storefront', 'One', 'Two'])
  })
})
