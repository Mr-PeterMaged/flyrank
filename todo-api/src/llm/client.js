const OpenAI = require('openai');

// The official SDK defaults to a 10-minute timeout and 2 silent retries — neither
// is right for an HTTP endpoint. We set both explicitly and own the retry policy
// ourselves (see complete.js), so a slow or flaky provider can't hold a request open.
const TIMEOUT_MS = 30000;

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  timeout: TIMEOUT_MS,
  maxRetries: 0,
});

module.exports = { client, TIMEOUT_MS, MODEL: process.env.LLM_MODEL };
