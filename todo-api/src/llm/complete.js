const fs = require('fs');
const path = require('path');
const { client, MODEL } = require('./client');
const { extractJson } = require('./parse');
const { TriageResult } = require('./schema');
const { logQuarantine } = require('./log');

const PROMPT_VERSION = 'triage-v1';
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '..', '..', 'prompts', `${PROMPT_VERSION}.md`),
  'utf8'
);

function formatValidationError(error) {
  if (error?.issues) {
    return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  }
  return error?.message ?? String(error);
}

async function callAndValidate(messages) {
  const response = await client.chat.completions.create({ model: MODEL, temperature: 0, messages });
  const text = response.choices[0].message.content;
  const parsed = extractJson(text);
  const result = parsed
    ? TriageResult.safeParse(parsed)
    : { success: false, error: { message: 'Response was not valid JSON' } };
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

  const first = await callAndValidate(messages);
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

  const repaired = await callAndValidate(repairMessages);
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
