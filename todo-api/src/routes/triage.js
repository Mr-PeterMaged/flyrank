const express = require('express');
const { TriageInput } = require('../llm/schema');

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

  // Stage 2 wires this up to a real prompt file and the model.
  res.status(501).json({ error: 'Not implemented yet — set LLM_STUB=1' });
});

module.exports = router;
