const { fetchHtml } = require('./fetcher');

const CATALOGUE_URL = 'https://books.toscrape.com/catalogue/page-1.html';

async function main() {
  await fetchHtml(CATALOGUE_URL, 'catalogue-page-1');
}

main();
