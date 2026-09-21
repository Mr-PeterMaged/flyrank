const fs = require('fs');
const path = require('path');
const { client, MODEL } = require('./client');
const { extractJson } = require('./parse');
const { TriageResult } = require('./schema');
const { logCost, logQuarantine } = require('./log');

const PROMPT_VERSION = 'triage-v1';
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '..', '..', 'prompts', `${PROMPT_VERSION}.md`),
  'utf8'
);

// 1 original attempt + 2 retries, explicit rather than the SDK's silent default of 2.
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 2000]; // wait before attempt 2, then before attempt 3

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(err) {
  if (err?.status === undefined) return true; // network error / timeout
  return err.status === 429 || err.status >= 500;
}

function retryAfterMs(err) {
  const header = err?.headers?.['retry-after'];
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function callModel(messages) {
  let lastErr;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await client.chat.completions.create({ model: MODEL, temperature: 0, messages });
      return { response, durationMs: Date.now() - startedAt };
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS - 1) {
        throw err;
      }
      const wait = retryAfterMs(err) ?? BACKOFF_MS[attempt] + Math.random() * 250;
      console.log(
        JSON.stringify({
          type: 'llm_retry',
          attempt: attempt + 1,
          status: err?.status ?? 'network_error',
          wait_ms: Math.round(wait),
        })
      );
      await sleep(wait);
    }
  }
  throw lastErr;
}

function formatValidationError(error) {
  if (error?.issues) {
    return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  }
  return error?.message ?? String(error);
}

async function callAndValidate(messages, { repair }) {
  const { response, durationMs } = await callModel(messages);
  const text = response.choices[0].message.content;
  const parsed = extractJson(text);
  const result = parsed
    ? TriageResult.safeParse(parsed)
    : { success: false, error: { message: 'Response was not valid JSON' } };

  logCost({
    prompt_version: PROMPT_VERSION,
    model: MODEL,
    input_tokens: response.usage?.prompt_tokens ?? null,
    output_tokens: response.usage?.completion_tokens ?? null,
    duration_ms: durationMs,
    repair,
    valid: result.success,
  });

  return { raw: text, result };
}

class QuarantineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuarantineError';
  }
}

async function triage(inputText) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify({ text: inputText }) },
  ];

  const first = await callAndValidate(messages, { repair: false });
  if (first.result.success) {
    return first.result.data;
  }

  // Repair once: hand the model its own broken output plus the exact validation error.
  const repairMessages = [
    ...messages,
    { role: 'assistant', content: first.raw },
    {
      role: 'user',
      content:
        `Your previous answer was rejected for this reason: ` +
        `${formatValidationError(first.result.error)}. ` +
        `Return only corrected JSON matching the schema — no code fence, no commentary.`,
    },
  ];

  const repaired = await callAndValidate(repairMessages, { repair: true });
  if (repaired.result.success) {
    return repaired.result.data;
  }

  logQuarantine({
    input: inputText,
    prompt_version: PROMPT_VERSION,
    first_attempt_raw: first.raw,
    repair_attempt_raw: repaired.raw,
    error: formatValidationError(repaired.result.error),
  });

  throw new QuarantineError('Model could not produce a schema-valid answer after one repair attempt');
}

module.exports = { triage, QuarantineError, PROMPT_VERSION };
