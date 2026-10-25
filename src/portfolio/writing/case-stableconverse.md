Founding design engineer @ StableConverse · 2026

# An inbox the AI and the shop share

StableConverse is an AI sales agent for shops in Bangladesh, answering DMs in Bangla, English or Banglish. As the team's **founding design engineer** I redesigned **the workspace, the inbox and the landing page**, then took on **when the AI should stop talking.**

![The StableConverse launch film](/films/1-47-am.mp4)

## Deliverables

As the founding design engineer I made these for the beta:

- **Workspace** Every page a shop's team works in, rebuilt on the brand. ![The orders page](/work/stableconverse/workspace/orders.png)
- **Inbox** Three columns, with take over and hand back. ![The inbox](/work/stableconverse/workspace/inbox.png)
- **Landing page** The hero, a customer's view in Messenger, and pricing. ![The landing page](/work/stableconverse/landing.mp4)
- **Olive and dark mode** The move off acid lime, and a second theme.
- **AI replies** Handoff to the team, safer orders and a rewritten prompt.
- **Test the AI** Test chats, suggested messages and an inspector.

## Background.

A shop connects its pages and its catalogue, and the AI answers customers and takes orders. The workspace is for the shop's people. They teach the AI, log orders, and step in when it gets something wrong.

When I started, the backend and the AI already worked. The screens around them didn't feel like somewhere you'd want to work all day.

## Problem.

The first workspace had misread the brand. To fix it I kept three threads in mind.

> **Brutalist by accident:** The landing page used square corners, so everything inside went brutalist. Two-pixel black borders on every button, card and input, hard offset shadows, buttons that sank into their shadow when pressed, and about sixty mono uppercase labels, most of them on ordinary form fields.
> **A lime nobody could look at:** The team found the acid lime tiring to look at and handed the recolour to me. Every other shade had been tuned to sit next to the lime, so none of them could stay.
> **Somewhere to work all day:** The people in it are a shop's team, watching the AI and stepping in when it slips. It had to be a tool they could sit in for hours, on a laptop or a phone.

## Solution.

I rebuilt every page on the brand's real system. A white page, Geist with tight tracking, thin lines, sharp rectangles for structure, pills and circles for anything you press, and one accent, now olive. Dark mode came with it, and light stays the default.

:::compare
Dashboard: ![Before](/work/stableconverse/case-study/before-dashboard.png) ![After](/work/stableconverse/case-study/after-dashboard.png)
Inbox: ![Before](/work/stableconverse/case-study/before-inbox.png) ![After](/work/stableconverse/workspace/inbox.png)
Catalogue: ![Before](/work/stableconverse/case-study/before-catalog.png) ![After](/work/stableconverse/workspace/catalog.png)
:::

## Inbox.

The old inbox was a list of threads beside a chat. I rebuilt it closer to Discord's DMs, in three columns: conversations with views and filters, the thread, and the customer on the right. In that panel the AI's summary comes first, then what it didn't know, then who the customer is.

Each thread has a status and a priority, buttons to take over from the AI and hand back to it, private notes for the team, voice notes and photos. Team channels live in the inbox too.

Most of this needed backend the product didn't have yet. I built the front end against a typed contract and a mock, so the team could use it and judge it straight away, and wrote down what the backend has to do to make each piece real.

## Unasked.

After that I made a pass nobody had asked for, as commits the seniors could drop if they disagreed. They kept them.

- The dashboard opens on setup, chats waiting for a person, and what the AI handled.
- The command palette searches customers, orders, products and chats.
- When the AI doesn't know something, the gap shows up in the chat, and one click adds it to the shop's Q&A with the question filled in.
- Customers open a detail panel instead of a bare order filter.

## Landing.

Testers told us the animated background on the old hero was too fast and made them feel sick. Someone also pointed out that a field of dots can set off tripophobia. Taking the animation out left the hero with no personality, and slowing it down turned it into something else.

I explored a set of new heroes. The team picked one and I liked another. The one that shipped came after both: the word stableconverse with a line swirling through it, and the inbox on a MacBook, sitting on an olive grid with rounded top corners.

![The StableConverse landing page](/work/stableconverse/landing.mp4)

Further down, a customer's view of Messenger shows a made-up Dhaka shop, Dhaka Threads, replying straight away, while the grid behind it lights up along a path like the snake in Snake. The page has no logos, quotes or numbers we can't back. Plans open by invitation, so every button says "I'm interested."

## AI replies.

Then I moved from the screens to the prompts. That pull request is still in review.

- The AI can hand a chat to the team. That opens a "Handed over by AI" escalation and stops it in that chat. A team member replying takes the chat over too.
- If the model fails, the customer gets nothing and the chat escalates. Before, they got raw text from the knowledge search.
- Stock is checked before an order goes through, archived products can't be sold, and an order is only ever shown to the customer who placed it.
- The prompt is rewritten around which facts to trust first, and it replies in Bangladeshi Bangla and Banglish.
- Test the AI keeps its test chats, suggests messages to try, and has an inspector that shows what the AI saw.

## Team.

StableConverse is Sef, Rafid, Adiyan and me. Sef built the backend and the AI core all of this runs on. {Rafid's and Adiyan's parts, in the words they'd use.}

##

**From redesign to replies, in numbers.** An earlier build of the AI replies passed 49 of the 51 cases in our beta test set. The final one hasn't had a full run yet.

| 92 | Commits. | Mine, from the redesign to the AI replies. |
| 60 | Mono labels. | About that many, taken off plain form fields. |
| 49/51 | Test cases. | Passed by an earlier build in the beta set. |
