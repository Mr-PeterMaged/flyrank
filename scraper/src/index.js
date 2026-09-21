const fs = require('fs');
const path = require('path');
const { discoverCataloguePages } = require('./discover');
const { extractBooks } = require('./extract');
const { normalizeAndValidate } = require('./normalize');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const startedAt = new Date();
  const stats = { pagesFetched: 0, cacheHits: 0, failedPages: [] };

  const bookUrls = await discoverCataloguePages(stats);

  // SCRAPER_INJECT_FAILURE=1 adds one made-up URL, on purpose, to prove the
  // pipeline survives a broken page without crashing (Stage 5 checkpoint).
  if (process.env.SCRAPER_INJECT_FAILURE === '1') {
    bookUrls.push([
      'https://books.toscrape.com/catalogue/this-book-does-not-exist_0000/index.html',
      'https://books.toscrape.com/catalogue/page-1.html',
    ]);
  }

  const rawRecords = await extractBooks(bookUrls, stats);
  const { valid, errors } = normalizeAndValidate(rawRecords);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(valid, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));

  const finishedAt = new Date();
  const report = {
    start_time: startedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    pages_fetched: stats.pagesFetched,
    cache_hits: stats.cacheHits,
    valid_records: valid.length,
    invalid_records: errors.length,
    failed_pages: stats.failedPages.length,
    failed_page_details: stats.failedPages,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(report, null, 2));

  console.log(
    `valid_records=${valid.length} invalid_records=${errors.length} failed_pages=${stats.failedPages.length}`
  );
}

main();
