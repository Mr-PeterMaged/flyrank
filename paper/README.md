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
