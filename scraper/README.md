# The polite scraper

A small, polite scraping pipeline: downloads the first 3 catalogue pages of
[Books to Scrape](https://books.toscrape.com/), visits all 60 book pages, turns the HTML into
clean, schema-checked JSON, survives a broken page without crashing, and ends every run with a
report of what happened.

Built for FlyRank Internship · Backend Track · W5 · Assignment A9.

## Target classification

- **Site:** [books.toscrape.com](https://books.toscrape.com/) ("Books to Scrape").
- **Why this site is appropriate:** it identifies itself as a sandbox built for practice. The
  homepage's own tagline is "We love being scraped!", and every page carries the banner:
  *"This is a demo website for web scraping purposes. Prices and ratings here were randomly
  assigned and have no real meaning."* This is the only kind of target this assignment touches.
- **Scope:** the first 3 catalogue pages only (`page-1.html` → `page-2.html` → `page-3.html`,
  followed via the site's own "next" link — never hardcoded), and the 60 book detail pages
  linked from them.
- **Data collected:** for each book — title, product URL, price, availability, star rating,
  description, plus which catalogue page it came from and when it was fetched. All of this is
  already public on the page; nothing behind a login or paywall is touched.
- **`robots.txt` check:** `GET https://books.toscrape.com/robots.txt` → **404 Not Found** — no
  robots file found. A missing file is not permission, it's just a missing file; permission here
  comes from the site's own explicit "please scrape me" description above, not from the absence
  of a robots file.

**I will not reuse this code on another site without checking its rules and terms first.**
