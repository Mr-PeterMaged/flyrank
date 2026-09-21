const cheerio = require('cheerio');
const { fetchHtml } = require('./fetcher');

const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';
const MAX_PAGES = 3;
const DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function discoverCataloguePages() {
  const bookUrls = [];
  let pageUrl = START_URL;
  let pageCount = 0;

  while (pageUrl) {
    pageCount += 1;
    const cacheKey = `catalogue-page-${pageCount}`;
    const { html, fromCache } = await fetchHtml(pageUrl, cacheKey);

    const $ = cheerio.load(html);
    $('article.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      bookUrls.push(new URL(href, pageUrl).toString());
    });

    const nextHref = $('li.next a').attr('href');
    pageUrl = pageCount < MAX_PAGES && nextHref ? new URL(nextHref, pageUrl).toString() : null;

    if (pageUrl && !fromCache) {
      await sleep(DELAY_MS);
    }
  }

  const uniqueUrls = [...new Set(bookUrls)];

  console.log(
    `catalogue_pages=${pageCount} discovered=${bookUrls.length} unique_urls=${uniqueUrls.length}`
  );

  return uniqueUrls;
}

module.exports = { discoverCataloguePages };
