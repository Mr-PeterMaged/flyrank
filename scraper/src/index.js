const { discoverCataloguePages } = require('./discover');
const { extractBooks } = require('./extract');

async function main() {
  const bookUrls = await discoverCataloguePages();
  const records = await extractBooks(bookUrls);
  console.log(JSON.stringify(records[0], null, 2));
}

main();
