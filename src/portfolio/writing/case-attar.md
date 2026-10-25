Product, design & code · 2026

# A perfume shop anyone can run for free

Attar is an **open-source perfume shop**: a storefront, an admin and deploy guides that cost nothing to run. It's built for shops that **confirm every order by phone** and take cash on delivery, bKash or Nagad. The demo gives **every visitor a private copy** of the store to try.

![The Attar storefront](/work/attar/storefront.mp4)

## Deliverables

Attar is one repo with everything a small shop needs:

- **Storefront** Browse, filter and check out with a phone number. ![The storefront](/work/attar/storefront.mp4)
- **Admin** An order queue built around the confirmation call. ![The admin](/work/attar/admin.png)
- **Demo sandbox** A private copy of the whole store for every visitor. ![Starting a demo store](/work/attar/case-study/demo-start.png)
- **Phone shop** A tab bar, sheets and swipeable photos on phones. ![The shop on a phone](/work/attar/case-study/mobile-home.png)

## Problem.

Plenty of shops here sell in a way shop templates don't expect. I kept three threads in mind.

> **Every order gets a call:** An order comes in, someone calls the customer to confirm it, and only then does the parcel go out.
> **No cards, no gateway:** Customers pay cash on delivery, or send the money by bKash and type in the transaction ID. Templates usually assume customer accounts, card checkout and a payment gateway.
> **Agents will change it:** A lot of shop owners would customise it with an AI agent, so the code had to be easy for one to change.

## Solution.

So I built a template a small perfume or attar seller could fork, rebrand from one file and deploy for nothing.

## Storefront.

The browsing borrows from Jomashop's deal-driven shop: brand-first navigation, strikethrough prices, deal badges, and filters made for perfume, like notes, concentration, size, and tester or gift set. Checkout asks for a name, a phone number and an address. There are no customer accounts. You track an order with its number and your phone.

It's built from 360 pixels up and scores 95 on Lighthouse mobile for the home, listing and product pages. On a phone it behaves like an app. A tab bar floats at the bottom, the bag and filters open as sheets you can flick away, and a product's photo grows into its gallery when you tap it.

## Admin.

I designed the admin first, and its look became the system the storefront follows.

It's built around the confirmation call. Orders waiting for a call come first. Each order has a status timeline, a call log, notes, payment checks and courier details. A switch blocks customers who place fake orders, and new orders ping the team on Telegram or by email.

:::strip
![The home page on a phone](/work/attar/case-study/mobile-home.png) ![Product listing with perfume filters](/work/attar/case-study/listing.png) ![Filters as a sheet](/work/attar/case-study/mobile-filters.png) ![A product page](/work/attar/case-study/product.png) ![A product's notes pyramid](/work/attar/case-study/product-notes.png) ![A product on a phone](/work/attar/case-study/mobile-product.png) ![Search suggestions](/work/attar/case-study/search-suggest.png) ![A listing on a phone](/work/attar/case-study/mobile-listing.png) ![Checkout: name, phone and address](/work/attar/case-study/checkout.png) ![Order confirmed](/work/attar/case-study/order-confirmed.png)
![An order, with its call log and payment](/work/attar/case-study/order-detail.png) ![An order in the admin, on a phone](/work/attar/case-study/mobile-order-detail.png) ![The order queue](/work/attar/case-study/orders.png) ![The product editor](/work/attar/case-study/product-editor.png) ![The order queue on a phone](/work/attar/case-study/mobile-orders.png) ![Homepage sections, drag to reorder](/work/attar/case-study/homepage.png) ![Coupons](/work/attar/case-study/coupons.png) ![The phone menu](/work/attar/case-study/mobile-menu.png) ![Review moderation](/work/attar/case-study/reviews.png)
:::

## Demo.

I wanted people to use the real admin, not watch a video of it. I also didn't want strangers editing the shop everyone else sees.

So "Try the admin" gives each visitor a private copy of the whole store for two hours. Under the hood each copy is a Postgres schema of its own, made in about 350 ms. The demo login works on your phone too, and your edits, orders and uploads only ever show up for you. Up to 50 copies run at once, the 51st replaces the oldest, and expired copies are deleted on their own.

## Code.

Attar is MIT-licensed on [GitHub](https://github.com/nadidazwad/nextjs-perfume-store), with CI, guides for Vercel with Neon and for Docker, and three releases so far. Everything shop-specific lives in one typed file, store.config.ts. A wrong value there stops the build and names the field and the reason. AGENTS.md gives coding agents the map and a recipe for each common change, like adding a filter or a homepage section.

## Setup.

Shop owners who'd rather not touch code can ask me to set it up for them, with their brand, products, delivery charges, bKash and Nagad numbers and their own domain. They can try the store's admin first in the [demo](https://nextjs-perfume-store.vercel.app/demo), and there's no payment until we've talked.

{How many shops have asked so far, and what came of it.}

##

**From fork to first order, in numbers.** They come from the repo's own checks and the demo's limits.

| 95 | Lighthouse mobile. | Home, listing and product pages. |
| 50 | Sandboxes at once. | Two hours each, a Postgres schema apiece. |
| 0 | Taka to run. | With Docker on a free VM. Vercel's free tier is for trying it. |
