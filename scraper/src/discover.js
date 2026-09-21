const cheerio = require('cheerio');
const { fetchHtml } = require('./fetcher');

const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';
const MAX_PAGES = 3;
const DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function discoverCataloguePages() {
  const bookUrls = [];
  const sourcePageByBookUrl = new Map();
  let pageUrl = START_URL;
  let pageCount = 0;

  while (pageUrl) {
    pageCount += 1;
    const cacheKey = `catalogue-page-${pageCount}`;
    const currentPageUrl = pageUrl;
    const { html, fromCache } = await fetchHtml(pageUrl, cacheKey);

    const $ = cheerio.load(html);
    $('article.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      const bookUrl = new URL(href, currentPageUrl).toString();
      bookUrls.push(bookUrl);
      if (!sourcePageByBookUrl.has(bookUrl)) {
        sourcePageByBookUrl.set(bookUrl, currentPageUrl);
      }
    });

    const nextHref = $('li.next a').attr('href');
    pageUrl = pageCount < MAX_PAGES && nextHref ? new URL(nextHref, currentPageUrl).toString() : null;

    if (pageUrl && !fromCache) {
      await sleep(DELAY_MS);
    }
  }

  const uniqueUrls = [...new Set(bookUrls)];

  console.log(
    `catalogue_pages=${pageCount} discovered=${bookUrls.length} unique_urls=${uniqueUrls.length}`
  );

  return uniqueUrls.map((url) => [url, sourcePageByBookUrl.get(url)]);
}

module.exports = { discoverCataloguePages };
