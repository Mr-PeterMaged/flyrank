const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const db = require('./db');
const { supabase, checkConnection } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

const toTask = (row) => ({ id: row.id, title: row.title, done: !!row.done });

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data.user);
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }
  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

const extractToken = (req) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

app.get('/public/info', (req, res) => {
  res.json({ message: 'Welcome stranger! This info is public.' });
});

app.get('/protected/profile', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  res.json({ message: 'token present, not yet verified' });
});

app.get('/tasks', async (req, res) => {
  const { rows } = await db.pool.query('SELECT * FROM tasks');
  res.json(rows.map(toTask));
});

app.get('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await db.pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (!rows[0]) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(toTask(rows[0]));
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const { rows } = await db.pool.query(
    'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
    [title, false]
  );
  res.status(201).json(toTask(rows[0]));
});

app.put('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows: existingRows } = await db.pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  const existing = existingRows[0];
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const { title, done } = req.body ?? {};
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'title or done is required' });
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean' });
  }
  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? done : existing.done;
  const { rows } = await db.pool.query(
    'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
    [newTitle, newDone, id]
  );
  res.json(toTask(rows[0]));
});

app.delete('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await db.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).end();
});

Promise.all([db.init(), checkConnection()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} and connected to Supabase`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
