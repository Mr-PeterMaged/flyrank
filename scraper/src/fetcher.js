const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternshipA9/1.0 (+https://github.com/Mr-PeterMaged/flyrank)';
const TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 1000;
const CACHE_DIR = path.join(__dirname, '..', 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const cachePath = (cacheKey) => path.join(CACHE_DIR, `${cacheKey}.html`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Fetches a URL with caching and one retry on timeout/network error/5xx.
// 404 and 403 are not retried: asking again won't create a missing page,
// and re-asking after a refusal is how a polite robot becomes a pest.
async function fetchHtml(url, cacheKey, stats) {
  const file = cachePath(cacheKey);

  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    console.log(`CACHE HIT ${cacheKey} (${html.length} bytes)`);
    if (stats) stats.cacheHits += 1;
    return { html, status: 200, fromCache: true };
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response;
    let networkError = null;

    try {
      response = await requestOnce(url);
    } catch (err) {
      networkError = err;
    }

    if (networkError) {
      console.log(`FETCH ${cacheKey} -> network error: ${networkError.message} (attempt ${attempt})`);
      if (attempt < 2) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      if (stats) stats.failedPages.push({ url, reason: networkError.message });
      return { html: null, status: null, fromCache: false };
    }

    if (response.status === 200) {
      const html = await response.text();
      fs.writeFileSync(file, html, 'utf8');
      console.log(`FETCH ${cacheKey} -> 200 (${html.length} bytes)`);
      if (stats) stats.pagesFetched += 1;
      return { html, status: 200, fromCache: false };
    }

    if (response.status >= 500 && attempt < 2) {
      console.log(`FETCH ${cacheKey} -> ${response.status} (retrying once)`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    console.log(`FETCH ${cacheKey} -> ${response.status} (not retried)`);
    if (stats) stats.failedPages.push({ url, reason: `HTTP ${response.status}` });
    return { html: null, status: response.status, fromCache: false };
  }

  return { html: null, status: null, fromCache: false };
}

module.exports = { fetchHtml, USER_AGENT, TIMEOUT_MS };
