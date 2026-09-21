const { z } = require('zod');

const TriageInput = z.object({
  text: z.string().min(1).max(2000),
});

const TriageResult = z.object({
  category: z.enum(['billing', 'bug', 'feature', 'other']),
  urgency: z.enum(['low', 'normal', 'high']),
  suggested_team: z.enum(['billing', 'engineering', 'product', 'support']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

module.exports = { TriageInput, TriageResult };
