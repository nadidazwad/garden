# An inbox the AI and the shop share

StableConverse is an AI sales agent for shops in Bangladesh. It answers DMs on WhatsApp, Messenger and Instagram, in Bangla, English or Banglish. As the team's **founding design engineer** I redesigned **the workspace, the inbox and the landing page**, then took on a harder question: **when should the AI stop talking?**

![The StableConverse inbox](/work/stableconverse/workspace/inbox.png "The inbox, on demo data.")

## Background.

A shop connects its pages and its catalogue, and the AI answers customers and takes orders. The workspace is for the shop's people. They teach the AI, log orders, and step in when it gets something wrong.

When I started, the backend and the AI already worked. The screens around them didn't feel like somewhere you'd want to work all day.

## Problem.

The first workspace had misread the brand. The landing page used square corners, so everything inside went brutalist: two-pixel black borders on every button, card and input, hard offset shadows, buttons that sank into their shadow when pressed, and about sixty mono uppercase labels, most of them on ordinary form fields.

The brand is quieter than that. A white page, Geist with tight tracking, thin lines, sharp rectangles for structure, pills and circles for anything you press, and one bright accent.

## Workspace.

I rebuilt every page on that system: the shell, the dashboard, orders, catalogue, customers, reports, settings and sign-in.

Then the accent changed. The team found the acid lime tiring to look at and handed the recolour to me. I moved the product to olive and reworked every shade that had been tuned to sit next to the lime. Dark mode came with it, and light stays the default.

After that I made a pass nobody had asked for, as commits the seniors could drop if they disagreed. They kept them.

- The dashboard opens on setup, chats waiting for a person, and what the AI handled.
- The command palette searches customers, orders, products and chats.
- When the AI doesn't know something, the gap shows up in the chat, and one click adds it to the shop's Q&A with the question filled in.
- Customers open a detail panel instead of a bare order filter.

## Inbox.

The old inbox was a list of threads beside a chat. I rebuilt it closer to Discord's DMs, in three columns: conversations with views and filters, the thread, and the customer on the right. In that panel the AI's summary comes first, then what it didn't know, then who the customer is.

Each thread has a status and a priority, buttons to take over from the AI and hand back to it, private notes for the team, voice notes and photos. Team channels live in the inbox too.

Most of this needed backend the product didn't have yet. I built the front end against a typed contract and a mock, so the team could use it and judge it straight away, and wrote down what the backend has to do to make each piece real.

## Landing.

Testers told us the animated background on the old hero was too fast and made them feel sick. Someone also pointed out that a field of dots can set off tripophobia. Taking the animation out left the hero with no personality, and slowing it down turned it into something else.

I explored a set of new heroes. The team picked one and I liked another. The one that shipped came after both: the word stableconverse with a line swirling through it, and the inbox on a MacBook, sitting on an olive grid with rounded top corners.

![The StableConverse landing page](/work/stableconverse/landing.mp4 "The landing page.")

Further down, a customer's view of Messenger shows a made-up Dhaka shop, Dhaka Threads, replying straight away, while the grid behind it lights up along a path like the snake in Snake. The page has no logos, quotes or numbers we can't back. Plans open by invitation, so every button says "I'm interested."

## AI replies.

Then I moved from the screens to the prompts. That pull request is still in review.

- The AI can hand a chat to the team. That opens a "Handed over by AI" escalation and stops it in that chat. A team member replying takes the chat over too.
- If the model fails, the customer gets nothing and the chat escalates. Before, they got raw text from the knowledge search.
- Stock is checked before an order goes through, archived products can't be sold, and an order is only ever shown to the customer who placed it.
- The prompt is rewritten around which facts to trust first, and it replies in Bangladeshi Bangla and Banglish.
- Test the AI keeps its test chats, suggests messages to try, and has an inspector that shows what the AI saw.

An earlier build passed 49 of the 51 cases in our beta test set. The final one hasn't had a full run yet.

## Team.

StableConverse is Sef, Rafid, Adiyan and me. Sef built the backend and the AI core all of this runs on. {Rafid's and Adiyan's parts, in the words they'd use.}
