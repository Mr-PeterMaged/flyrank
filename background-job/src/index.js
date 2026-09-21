const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('./inngest/client');
const { sayHello } = require('./inngest/functions');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/inngest', serve({ client: inngest, functions: [sayHello] }));

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
