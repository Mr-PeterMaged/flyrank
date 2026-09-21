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

## Install & run

Requires [Node.js](https://nodejs.org/) 20+ (no database, proxy, or paid API).

```
cd scraper
npm install
npm start
```

This runs the full pipeline: discover the 3 catalogue pages → visit all 60 book pages → clean
and validate → write `output/books.json`, `output/errors.json`, and `output/run-report.json`.
While developing, delete `cache/` to force fresh fetches, or leave it in place so reruns read
from disk instead of the site — that's what makes it safe to run fifty times while iterating.

To prove the pipeline survives a broken page (Stage 5's checkpoint), run with one made-up book
URL injected on purpose:

```
SCRAPER_INJECT_FAILURE=1 npm start
```

## Record schema

Every record in `output/books.json` is validated against this shape (`src/schema.js`, Zod)
before it's stored; anything that fails lands in `output/errors.json` with a reason instead:

| Field | Type | Notes |
|---|---|---|
| `title` | string | non-empty |
| `product_url` | string (URL) | absolute, `https://…` — this is the record's canonical identity |
| `price_text` | string | raw text as shown on the page, e.g. `"£51.77"` |
| `price_gbp` | number | parsed from `price_text`, e.g. `51.77` |
| `availability_text` | string | e.g. `"In stock (22 available)"` |
| `rating_text` | string \| null | e.g. `"Three"` |
| `description` | string \| null | `null` when the page has none — never invented |
| `source_page` | string (URL) | which catalogue page linked to this book |
| `fetched_at` | string (ISO datetime) | when this record was fetched |

## Politeness rules

Every real request (not a cache hit):
- sends an honest `User-Agent`: `FlyRankInternshipA9/1.0 (+https://github.com/Mr-PeterMaged/flyrank)`
- has a 10s timeout — a request never hangs forever
- checks the status code before parsing anything; only `200` is treated as a page
- waits at least 500ms before the next request
- retries once on a timeout, network error, or `5xx` — never on `404` or `403`, since asking
  again won't create a missing page or turn a refusal into a yes

Every fetched page is cached to `cache/*.html` (git-ignored). Development and reruns read the
cache instead of hitting the site again — the site should feel this pipeline once, not fifty
times.

## A real run

```json
{
  "start_time": "2026-09-21T07:24:42.620Z",
  "duration_ms": 499,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_page_details": []
}
```

(`pages_fetched: 0` here because this run's pages were already cached from an earlier run —
`cache_hits: 63` covers the 3 catalogue pages plus 60 book pages.)

## Why no browser was needed

Every field this pipeline collects — title, price, availability, rating, description — is
already present in the HTML the server sends back on the very first request; nothing is filled
in later by JavaScript. A plain HTTP `fetch` plus an HTML parser (Cheerio) reads all of it. A
headless browser (Playwright, Puppeteer) would only add startup cost and memory for zero extra
data on this particular site.

## Ethics

- Prefer an official API over scraping whenever one exists — this project only scrapes because
  Books to Scrape is a sandbox with no API, built specifically for this kind of practice.
- Never bypass a login, a paywall, or a block (a `403` or a CAPTCHA) — that's the site telling
  you no, and a polite robot listens.
- Collect only the data actually needed for the task, nothing more.

## Honest limitation

The retry logic is a single retry with a fixed 1s delay — real exponential backoff with jitter,
respecting a `Retry-After` header, and structured per-attempt logs are deliberately left for next
week's assignment (A16), which builds the production version of this exact pipeline.
