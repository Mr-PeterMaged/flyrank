const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

const toTask = (row) => ({ id: row.id, title: row.title, done: !!row.done });

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

app.post('/tasks', (req, res) => {
  const { title } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run(title, 0);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(toTask(row));
});

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
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
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(toTask(row));
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).end();
});

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  });
