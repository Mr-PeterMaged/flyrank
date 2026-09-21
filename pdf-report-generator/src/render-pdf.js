const { chromium } = require('playwright');

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function buildHtml(data) {
  const today = new Date().toISOString().slice(0, 10);

  const topRows = data.topExpensive
    .map((b) => `<tr><td>${escapeHtml(b.title)}</td><td>£${b.price.toFixed(2)}</td></tr>`)
    .join('\n');

  const ratingRows = data.byRating
    .map((r) => `<tr><td>${r.rating} star${r.rating === 1 ? '' : 's'}</td><td>${r.count}</td></tr>`)
    .join('\n');

  const allRows = data.allBooks
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.title)}</td><td>£${b.price.toFixed(2)}</td><td>${b.rating}</td></tr>`
    )
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 0; }
  .subtitle { color: #666; margin-top: 4px; }
  .totals { display: flex; gap: 40px; margin: 20px 0; }
  .totals div { border: 1px solid #ddd; padding: 10px 16px; border-radius: 6px; }
  .totals .label { color: #666; font-size: 11px; }
  .totals .value { font-size: 20px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eee; }
  th { background: #f4f4f4; }
  h2 { font-size: 15px; margin-top: 28px; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
</style>
</head>
<body>
  <h1>Books to Scrape — Catalogue Report</h1>
  <div class="subtitle">Generated ${today}</div>

  <div class="totals">
    <div><div class="label">Total books</div><div class="value">${data.totalBooks}</div></div>
    <div><div class="label">Average price</div><div class="value">£${data.averagePrice.toFixed(2)}</div></div>
  </div>

  <h2>Top 5 most expensive books</h2>
  <table>
    <thead><tr><th>Title</th><th>Price</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>

  <h2>Books per star rating</h2>
  <table>
    <thead><tr><th>Rating</th><th>Count</th></tr></thead>
    <tbody>${ratingRows}</tbody>
  </table>

  <h2>All ${data.allBooks.length} books</h2>
  <table>
    <thead><tr><th>Title</th><th>Price</th><th>Rating</th></tr></thead>
    <tbody>${allRows}</tbody>
  </table>
</body>
</html>`;
}

async function renderPdf(data, outputPath) {
  const html = buildHtml(data);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

module.exports = { renderPdf, buildHtml };
