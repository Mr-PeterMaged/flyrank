const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendLine(file, obj) {
  fs.appendFileSync(path.join(LOG_DIR, file), JSON.stringify(obj) + '\n', 'utf8');
}

// One line per model call: prompt version, model, tokens, duration, repair count.
// Written to stdout as structured JSON (per twelve-factor logging) and also kept
// in logs/cost.jsonl locally so the README's cost line has something to read from.
function logCost(entry) {
  const line = { type: 'llm_cost', ...entry };
  console.log(JSON.stringify(line));
  appendLine('cost.jsonl', line);
}

// A failed-and-unrepaired answer, kept with the input, the error, and the prompt
// version — quarantined instead of reaching the caller or crashing the process.
function logQuarantine(entry) {
  appendLine('quarantine.jsonl', { type: 'llm_quarantine', ...entry });
}

module.exports = { logCost, logQuarantine };
