const cheerio = require('cheerio');
const { fetchHtml } = require('./fetcher');

const DELAY_MS = 500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheKeyFor = (bookUrl) => {
  const slug = new URL(bookUrl).pathname.split('/').filter(Boolean).slice(-2, -1)[0];
  return `book-${slug}`;
};

function parseBookPage(html, bookUrl, sourcePage) {
  const $ = cheerio.load(html);
  const main = $('.product_main');

  const title = main.find('h1').text().trim();
  const priceText = main.find('p.price_color').first().text().trim();
  const availabilityText = main.find('p.availability').text().trim().replace(/\s+/g, ' ');
  const ratingClass = main.find('p.star-rating').attr('class') ?? '';
  const ratingText = ratingClass.replace('star-rating', '').trim() || null;
  const descriptionEl = $('#product_description').next('p');
  const description = descriptionEl.length ? descriptionEl.text().trim() : null;

  return {
    title,
    product_url: bookUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

async function extractBooks(bookUrlToSourcePage, stats) {
  const records = [];
  let count = 0;

  for (const [bookUrl, sourcePage] of bookUrlToSourcePage) {
    const { html, fromCache } = await fetchHtml(bookUrl, cacheKeyFor(bookUrl), stats);
    if (html) {
      try {
        records.push(parseBookPage(html, bookUrl, sourcePage));
        count += 1;
      } catch (err) {
        console.log(`PARSE FAIL ${bookUrl} -> ${err.message}`);
        if (stats) stats.failedPages.push({ url: bookUrl, reason: `parse error: ${err.message}` });
      }
    }
    if (!fromCache) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`detail_pages=${count}`);
  return records;
}

module.exports = { extractBooks, parseBookPage };
