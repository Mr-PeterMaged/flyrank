const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternshipA9/1.0 (+https://github.com/Mr-PeterMaged/flyrank)';
const TIMEOUT_MS = 10000;
const CACHE_DIR = path.join(__dirname, '..', 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const cachePath = (cacheKey) => path.join(CACHE_DIR, `${cacheKey}.html`);

async function fetchHtml(url, cacheKey) {
  const file = cachePath(cacheKey);

  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    console.log(`CACHE HIT ${cacheKey} (${html.length} bytes)`);
    return { html, status: 200, fromCache: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (response.status !== 200) {
    console.log(`FETCH ${cacheKey} -> status ${response.status} (not cached)`);
    return { html: null, status: response.status, fromCache: false };
  }

  const html = await response.text();
  fs.writeFileSync(file, html, 'utf8');
  console.log(`FETCH ${cacheKey} -> 200 (${html.length} bytes)`);
  return { html, status: 200, fromCache: false };
}

module.exports = { fetchHtml, USER_AGENT, TIMEOUT_MS };
