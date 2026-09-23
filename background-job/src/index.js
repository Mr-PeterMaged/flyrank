const crypto = require('crypto');
const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('./inngest/client');
const { sayHello, makeReport, heartbeat } = require('./inngest/functions');
const { reports } = require('./reports-store');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/inngest', serve({ client: inngest, functions: [sayHello, makeReport, heartbeat] }));

app.post('/reports', async (req, res) => {
  const { topic } = req.body ?? {};
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'topic is required' });
  }

  const id = crypto.randomUUID();
  reports.set(id, { id, topic, status: 'pending' });

  await inngest.send({ name: 'report/requested', data: { id, topic } });

  res.status(202).json({ id, status: 'pending' });
});

app.get('/reports/:id', (req, res) => {
  const report = reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Server listening on http://localhost:3000');
});
