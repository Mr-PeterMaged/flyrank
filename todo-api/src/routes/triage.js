const fs = require('fs');
const path = require('path');
const express = require('express');
const { TriageInput } = require('../llm/schema');
const { client, MODEL } = require('../llm/client');

const router = express.Router();

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '..', '..', 'prompts', 'triage-v1.md'),
  'utf8'
);

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

  // Stage 3 adds parse + validate + repair; for now, return whatever the model said.
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ text: parsedInput.data.text }) },
    ],
  });
  res.json({ raw: response.choices[0].message.content });
});

module.exports = router;
