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

  const bookUrls = await discoverCataloguePages();
  const rawRecords = await extractBooks(bookUrls);
  const { valid, errors } = normalizeAndValidate(rawRecords);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(valid, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));

  console.log(`valid_records=${valid.length} invalid_records=${errors.length}`);
}

main();
