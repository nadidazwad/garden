# A perfume shop anyone can run for free

Attar is an **open-source perfume shop**: a storefront, an admin and deploy guides that cost nothing to run. It's built for shops that **confirm every order by phone** and take cash on delivery, bKash or Nagad. The demo gives **every visitor a private copy** of the store to try.

![The Attar storefront](/work/attar/storefront.mp4 "The storefront, stocked with fictional brands.")

## Background.

Plenty of shops here sell like this. An order comes in, someone calls the customer to confirm it, and the parcel goes out cash on delivery, or the customer sends the money by bKash and types in the transaction ID. Shop templates usually assume the opposite: customer accounts, card checkout and a payment gateway.

I wanted a template a small perfume or attar seller could fork, rebrand from one file and deploy for nothing. It also had to be easy for an AI agent to change, since that's how a lot of shop owners would customise it.

## Storefront.

The browsing borrows from Jomashop's deal-driven shop: brand-first navigation, strikethrough prices, deal badges, and filters made for perfume, like notes, concentration, size, and tester or gift set. Checkout asks for a name, a phone number and an address. There are no customer accounts. You track an order with its number and your phone.

It's built from 360 pixels up and scores 95 on Lighthouse mobile for the home, listing and product pages. On a phone it behaves like an app. A tab bar floats at the bottom, the bag and filters open as sheets you can flick away, and a product's photo grows into its gallery when you tap it.

## Admin.

I designed the admin first, and its look became the system the storefront follows.

It's built around the confirmation call. Orders waiting for a call come first. Each order has a status timeline, a call log, notes, payment checks and courier details. A switch blocks customers who place fake orders, and new orders ping the team on Telegram or by email.

![The Attar admin](/work/attar/admin.png "The admin, with the call queue first.")

## Demo.

I wanted people to use the real admin, not watch a video of it. I also didn't want strangers editing the shop everyone else sees.

So "Try the admin" gives each visitor a private copy of the whole store for two hours. Under the hood each copy is a Postgres schema of its own, made in about 350 ms. The demo login works on your phone too, and your edits, orders and uploads only ever show up for you. Up to 50 copies run at once, the 51st replaces the oldest, and expired copies are deleted on their own.

## Code.

Attar is MIT-licensed on [GitHub](https://github.com/nadidazwad/nextjs-perfume-store), with CI, guides for Vercel with Neon and for Docker, and three releases so far. Everything shop-specific lives in one typed file, store.config.ts. A wrong value there stops the build and names the field and the reason. AGENTS.md gives coding agents the map and a recipe for each common change, like adding a filter or a homepage section.

## Setup.

Shop owners who'd rather not touch code can ask me to set it up for them, with their brand, products, delivery charges, bKash and Nagad numbers and their own domain. The request form is on the [demo](https://nextjs-perfume-store.vercel.app/get-your-store), and there's no payment until we've talked.

{How many shops have asked so far, and what came of it.}
