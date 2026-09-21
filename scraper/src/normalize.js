const { BookRecord } = require('./schema');

function parsePriceGbp(priceText) {
  const match = priceText.match(/[\d.]+/);
  return match ? Number(match[0]) : NaN;
}

function normalizeAndValidate(rawRecords) {
  const valid = [];
  const errors = [];
  const seenUrls = new Set();

  for (const raw of rawRecords) {
    if (seenUrls.has(raw.product_url)) {
      continue;
    }
    seenUrls.add(raw.product_url);

    const candidate = { ...raw, price_gbp: parsePriceGbp(raw.price_text) };
    const result = BookRecord.safeParse(candidate);

    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        product_url: raw.product_url,
        reason: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }
  }

  return { valid, errors };
}

module.exports = { normalizeAndValidate, parsePriceGbp };
