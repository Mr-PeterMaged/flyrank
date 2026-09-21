const express = require('express');
const { TriageInput } = require('../llm/schema');
const { triage, QuarantineError } = require('../llm/complete');

const router = express.Router();

// LLM_STUB=1 skips the model entirely and returns a fixed, schema-valid object.
// This is how every later stage gets built and restarted without spending a call.
const STUB_RESPONSE = {
  category: 'other',
  urgency: 'low',
  suggested_team: 'support',
  confidence: 0.42,
  reason: 'Stub mode response — no model was called.',
};

router.post('/triage', async (req, res) => {
  const parsedInput = TriageInput.safeParse(req.body);
  if (!parsedInput.success) {
    const issue = parsedInput.error.issues[0];
    return res.status(400).json({ error: `${issue.path.join('.') || 'text'}: ${issue.message}` });
  }

  if (process.env.LLM_STUB === '1') {
    return res.json(STUB_RESPONSE);
  }

  // Kill switch: flip LLM_ENABLED off without a deploy — an outage, a runaway bill,
  // or a model saying something embarrassing are all "turn it off now" situations.
  if (process.env.LLM_ENABLED === 'false') {
    return res.status(503).json({ error: 'LLM feature is currently disabled' });
  }

  try {
    const result = await triage(parsedInput.data.text);
    res.json(result);
  } catch (err) {
    if (err instanceof QuarantineError) {
      return res.status(422).json({ error: err.message });
    }
    if (err?.status === undefined) {
      // No HTTP status means the request never completed — timeout or network error.
      return res.status(504).json({ error: 'The model took too long to respond' });
    }
    console.error(JSON.stringify({ type: 'llm_error', message: err.message, status: err.status }));
    res.status(502).json({ error: 'The model provider returned an error' });
  }
});

module.exports = router;
