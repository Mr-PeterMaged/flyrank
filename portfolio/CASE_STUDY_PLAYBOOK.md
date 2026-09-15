# How to add the next case study

Three-beat shape (same one from Week 2 — reuse it every time, don't reinvent the format):
**Problem → What I did → What came of it.** One card, four lines max, one link.

## The steps, in order

1. Finish the real work first (repo, notebook, deployed page — whatever proof exists).
2. Write the three beats in plain language, no jargon a bank-HR recruiter wouldn't know:
   - **Problem** — the decision or question, one sentence.
   - **What I did** — the concrete action, one sentence (name the real tool/data size if it's
     impressive — "78.8M rows," not "big data").
   - **What came of it** — one number or outcome, stated plainly (with the honest caveat if
     there is one — recruiters trust a stated limit more than a bare claim).
3. Add one link: the live demo/deployed page if one exists, else the repo. "Testable in one
   click" is part of the claim (per the sitemap feedback) — a card with no link doesn't count.
4. Drop the card into WORK. Cap at 3-4 cards total — cut or archive the weakest one before
   adding a new one, don't just keep appending.
5. Re-check the HERO line still matches what WORK now proves — if the new case shifts your
   strongest claim (e.g. from "builds things" to "ships data pipelines"), update HERO too.
6. Push. Deploy. Done — no rebuild, because the Claude Project already has your voice, stack,
   and identity kit; this is a five-minute conversation, not a from-scratch session.

## Next real piece of work: the FlyRank capstone

Named now, drafted now, so adding it later is just pasting this in and pointing the link:

> **Problem** — Which content pages should a reviewer with limited time check first for refresh?
> **What I did** — Rebuilt the scoring pipeline directly from FlyRank's 78.8M-row production
> search warehouse (not a sample), with a forward-looking label and a sealed test period the
> model never saw during development.
> **What came of it** — Precision@50 went 0.68 → 0.96 on that sealed test, clear of the 0.61
> base rate — with the honest caveat stated up front (directional, not causal).
> **Link** — [flyrank-eight.vercel.app](https://flyrank-eight.vercel.app/) (paper) ·
> [github.com/Mr-PeterMaged/flyrank](https://github.com/Mr-PeterMaged/flyrank) (repo)

## Reminder

A real scheduled reminder is set — not a note-to-self, an actual cloud trigger that will check
in and offer to help:

- **Fires:** 2026-09-22, 10:00 Africa/Cairo (08:00 UTC) — one week out
- **Routine:** `trig_01ERw4FTZ6bn4QS72nabgZaq` — https://claude.ai/code/routines/trig_01ERw4FTZ6bn4QS72nabgZaq
- **What it does:** reads this file, then messages to add the FlyRank case study card above
  into WORK — and if the HERO/WORK/ABOUT/CONTACT site doesn't exist yet, offers to scaffold it
  from the sitemap in `README.md` and the reviewed feedback in `../Portfolio_Sitemap_Feedback.docx`.

## Keep the build context

Don't start a fresh Claude conversation for the next case — keep using the same claude.ai
Project this portfolio work has been happening in. It already knows the voice, the stack, and
the identity kit (bank-HR framing, the HERO claim, the curated-4 rule); reusing it turns "add a
case study" into a five-minute conversation instead of a rebuild from zero.
