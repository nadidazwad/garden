Design & code @ QuickHajj · 2025–26

# The second QuickHajj is the quiet one

QuickHajj plans Hajj and Umrah journeys from Dhaka. I design and build its website. The one live now at [quickhajj.com](https://www.quickhajj.com) replaced a **louder first version**, and its Bangla is **written, not translated**.

![The QuickHajj homepage in English and in Bangla](/work/quickhajj/home.mp4)

## Deliverables

For version two I made:

- **Website** Hajj and Umrah packages, enquiries and a blog. ![The live homepage](/work/quickhajj/two-versions/v2-live.png)
- **Bangla site** Its own copy, type and pages under /bn. ![The Bangla homepage](/work/quickhajj/case-study/bangla.png)
- **Umrah campaign** A poster for newlyweds, in English. ![My English poster beside a colleague's Bangla one](/work/quickhajj/umrah-campaign.png)
- **Enquiry form** Short, hard to spam, with WhatsApp to fall back on. ![The enquiry form](/work/quickhajj/case-study/enquiry.png)

## Background.

QuickHajj is an initiative of Karol Travels International, a government-listed Hajj agency with licence 0872. The people reading the site are pilgrims and the family members helping them choose. They're about to trust an agency with a lot of money and the most important journey of their lives.

So the site has one job. A visitor should finish reading and think, **"they seem trustworthy, let's book a consultation."** Both versions were a try at that sentence.

## Problem.

Looking back, version one was trying to look premium. For version two I kept three threads in mind.

> **Premium isn't trust:** Version one had smooth scrolling, a glass header, and a gold serif logo over a full-bleed photo of the Kaaba. A family choosing a Hajj agency isn't checking for any of that.
> **Proof over promises:** They want to know the agency is real, what they're paying for, and who picks up the phone.
> **Two languages:** Version one added Bangla as a translation. Bangla readers deserved copy written for them.

## Solution.

I started again from an empty project and wrote the design system before the pages. It starts from one line: **calm, editorial and evidence-led**. A white page, near-black type, thin dividers, and one warm yellow kept for buttons, selections and the frame around the artwork.

The proof is the kind you can check. The licence number sits right under the headline. There are no made-up testimonials, numbers or experts, and if we couldn't back a claim, it stayed off the page. The main button books a consultation, not a package.

The footer reads like a ledger. The main phone number comes first, then the other numbers, WhatsApp, email, the office and its hours, and the licence line closes the page. Shared links used to show no picture, because every share image was AVIF, which WhatsApp, Facebook, LinkedIn and X don't display. Now every page shares a card with the licence, the phone number and the address, in the page's language.

:::compare
Home: ![Version one](/work/quickhajj/two-versions/v1.png) ![Version two](/work/quickhajj/two-versions/v2-live.png)
:::

## Bangla.

The Bangla site isn't a translation pass. It has its own copy, written for Bangladeshi readers and approved by the agency, its own type, and its own pages under /bn, blog included.

English headings are tracked tight. Bangla can't be tracked without breaking the line its letters hang from, so its headings narrow instead, set in Anek Bangla at a condensed width. Everything else is Noto Sans Bengali, at the English sizes.

At first the site sent visitors in Bangladesh straight to Bangla. We dropped that within a day. Everyone starts in English now, and the site remembers if you switch.

## Enquiries.

The enquiry form is short and hard to abuse. Cloudflare Turnstile checks for bots, and each IP address can send five enquiries every fifteen minutes. The addresses are hashed before they're stored. If any of that is down in production, the form closes and sends people to WhatsApp instead of failing quietly. Analytics count enquiries and WhatsApp taps, never names or phone numbers.

## Campaign.

In late September the agency wanted to sell Umrah to newlyweds, as the first journey after the wedding. The brief had two rules. Don't say honeymoon, and don't say package.

I made the English poster, and most of the work was saying no. I threw out:

- sandals beside the Kaaba, because nobody wears shoes where tawaf happens
- a wedding at the Kaaba, because couples marry at home or in Madinah and travel after
- a line built on "qubool", because it's a South Asian wedding word and Umrah draws couples from everywhere
- a bride in a dress that didn't fit the occasion

What was left is a couple facing Masjid al-Haram in the brand's yellow, under "The walk after the wedding." A colleague made the Bangla poster, a couple holding hands in Madinah, her hands gloved. Side by side, you can see what keeping to the brand does. On the site the poster opens full size from the yellow bar above the header, and sends you to WhatsApp with the message already written in your language.

![My English poster beside a colleague's Bangla one](/work/quickhajj/umrah-campaign.png)

## Umrah.

I'd first put the campaign into the homepage's Umrah section in a hurry, because that was the only place Umrah lived on the site. The section was meant to be about custom Umrah. Almost every Umrah from Bangladesh gets changed around the pilgrim, even when it starts from a set package.

So the poster moved up to the bar, the section got new artwork, and Umrah got pages of its own. The first package is Couple, seven days for two with a private room by each mosque, and flights, visa and ziyarat included. Next to it is a card for building your own, and the page opens on "Start with a package, then make it yours."

## Outcome.

Live at quickhajj.com since August 2026, with my name in the footer. I designed the site myself, both versions in both languages. {What changed for the agency: enquiries, consultations booked, what the owner said.}
