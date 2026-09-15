# portfolio/

Peter Maged's personal portfolio — plain static HTML/CSS, no build step. Lives in the same repo
as the FlyRank internship work, deployed as its own Vercel project (same pattern as `paper/`).

Sitemap (per the reviewed feedback in `../Portfolio_Sitemap_Feedback.docx`, bank-HR-recruiter
read): **HERO → WORK (4 curated, live projects) → ABOUT + SKILLS → CONTACT**.

## Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. Set **Root Directory = `portfolio`** (click **Edit** next to it if it defaults to `./`).
   Until this is set, Vercel scans the repo root and may auto-detect the wrong preset (e.g.
   "Python," because `requirements.txt` lives at the repo root for the internship pipeline) —
   that's a false read, not a real dependency of this site.
3. **Application Preset: Other** (static site — no build command, no output directory, no
   install command needed; toggle those fields off if Vercel pre-fills them).
4. Deploy → you get a `https://<something>.vercel.app` URL, independent of the paper's domain.

## Before it goes fully live

- `about` section has one clearly-marked draft line ("why banking") — personalize it, then
  delete the note under it.
- `CV` links to `pm-cv.vercel.app` (the Resume Studio project itself) rather than a static PDF —
  swap in a direct PDF link if/when you export one.

See [`CASE_STUDY_PLAYBOOK.md`](CASE_STUDY_PLAYBOOK.md) before adding or updating any project
card in WORK later — it's the repeatable habit, not a one-off.
