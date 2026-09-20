const Database = require('better-sqlite3');

const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const { count } = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (count === 0) {
  const seed = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const seedAll = db.transaction((rows) => {
    for (const row of rows) seed.run(row.title, row.done);
  });
  seedAll([
    { title: 'Buy milk', done: 0 },
    { title: 'Walk the dog', done: 0 },
    { title: 'Write README', done: 1 },
  ]);
}

module.exports = db;
