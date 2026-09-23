# Search Intelligence — Research Paper

**Designed and developed by [Peter Maged](https://petermaged.com/).**

An applied search intelligence case study presenting methodology, results and reproducible implementation references.

## Product and technical overview

- **Implementation:** HTML, CSS, research figures and linked notebooks.
- **Deployment:** Vercel static project page; [DEPLOYMENT.md](DEPLOYMENT.md) contains exact settings and operational requirements.
- **Ownership:** Peter Maged's project implementation; third-party libraries and upstream materials retain their attribution.
- **License:** [LICENSE](LICENSE). Available for portfolio review, evaluation and further development under these terms.

For project enquiries and implementation work: [petermaged.com](https://petermaged.com/).

## Engineering guide and existing evidence

# paper/

The deployed capstone research paper — plain static HTML/CSS, no build step, no dependencies.

## Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. In the import screen, set **Root Directory** to `paper` (this repo has other folders at its
   root, so Vercel needs to know this subfolder is the site).
3. Framework preset: **Other** (static — no build command, no output directory needed).
4. Deploy. Vercel gives you a `https://<something>.vercel.app` URL.
5. Put that exact URL in `submission/paper_url.txt` at the repo root.

That's it — `index.html` plus the two `.png` charts next to it are the whole site.
