# The second QuickHajj is the quiet one

QuickHajj plans Hajj and Umrah journeys from Dhaka. I design and build its website. The one live now at [quickhajj.com](https://www.quickhajj.com) replaced a **louder first version**, and its Bangla is **written, not translated**.

![The QuickHajj homepage in English and in Bangla](/work/quickhajj/home.mp4 "The homepage, in English and Bangla.")

## Background.

QuickHajj is an initiative of Karol Travels International, a government-listed Hajj agency with licence 0872. The people reading the site are pilgrims and the family members helping them choose. They're about to trust an agency with a lot of money and the most important journey of their lives.

So the site has one job. A visitor should finish reading and think, **"they seem trustworthy, let's book a consultation."** Both versions were a try at that sentence.

## Versions.

- **Version one, November 2025 to July 2026.** Smooth scrolling, a glass header, a gold serif logo over a full-bleed photo of the Kaaba, and from June, a Bangla translation.
- **Version two, live since August 2026.** I started again from an empty project and wrote the design system before the pages.

![The earlier QuickHajj homepage](/work/quickhajj/four-versions/v1.png "Version one.")

## Problem.

Looking back, version one was trying to look premium. Gold, glass, motion on everything. A family choosing a Hajj agency isn't checking for premium. They want to know the agency is real, what they're paying for, and who picks up the phone.

## Approach.

The live site's design system starts from one line: **calm, editorial and evidence-led**. A white page, near-black type, thin dividers, and one warm yellow kept for buttons, selections and the frame around the artwork. Large, light headings. Short paragraphs.

The proof is the kind you can check. The licence number sits right under the headline. There are no made-up testimonials, numbers or experts, and if we couldn't back a claim, it stayed off the page. The main button books a consultation, not a package.

## Bangla.

The Bangla site isn't a translation pass. It has its own copy, written for Bangladeshi readers and approved by the agency, its own type in Noto Sans Bengali, and its own pages under /bn, blog included.

At first the site sent visitors in Bangladesh straight to Bangla. We dropped that within a day. Everyone starts in English now, and the site remembers if you switch.

## Enquiries.

The enquiry form is short and hard to abuse. Cloudflare Turnstile checks for bots, and each IP address can send five enquiries every fifteen minutes. The addresses are hashed before they're stored. If any of that is down in production, the form closes and sends people to WhatsApp instead of failing quietly. Analytics count enquiries and WhatsApp taps, never names or phone numbers.

## Campaign.

In late September the agency wanted to sell Umrah to newlyweds, as the first journey after the wedding. The posters had two rules. Don't say honeymoon, and don't say package.

Most of the work was saying no. I threw out:

- sandals beside the Kaaba, because nobody wears shoes where tawaf happens
- a wedding at the Kaaba, because couples marry at home or in Madinah and travel after
- a line built on "qubool", because it's a South Asian wedding word and Umrah draws couples from everywhere
- a bride in a dress that didn't fit the occasion

The Bangla poster shows a couple holding hands in Madinah, her hands gloved. The English one has them facing Masjid al-Haram, under "The walk after the wedding." On the site the poster takes the place of a decorative minaret, opens full size, and sends you to WhatsApp with the message already written in your language.

![The Umrah campaign posters in English and Bangla](/work/quickhajj/umrah-campaign.png "The English and Bangla posters.")

## Outcome.

Live at quickhajj.com since August 2026, with my name in the footer. {What changed for the agency: enquiries, consultations booked, what the owner said.}
