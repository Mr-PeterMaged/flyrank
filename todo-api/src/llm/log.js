const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// A failed-and-unrepaired answer, kept with the input, the error, and the prompt
// version — quarantined instead of reaching the caller or crashing the process.
function logQuarantine(entry) {
  const line = { type: 'llm_quarantine', ...entry };
  fs.appendFileSync(path.join(LOG_DIR, 'quarantine.jsonl'), JSON.stringify(line) + '\n', 'utf8');
}

module.exports = { logQuarantine };
