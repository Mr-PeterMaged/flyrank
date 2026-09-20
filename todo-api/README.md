# Task API

A small CRUD API for a to-do list, built with Node.js and Express. Data is stored in a
[SQLite](https://sqlite.org/) database file, `tasks.db`, so it survives a server restart.

Built for FlyRank Internship · Backend Track · W2 (Assignment A1) and W3 (Assignment A2).

## Why SQLite

SQLite needs no separate server and no install of its own — the whole database is one file
on disk. `db.js` opens (and if needed creates) `tasks.db`, creates the `tasks` table if it's
missing, and seeds 3 example tasks only the first time the table is empty. That's enough for
a project this size: zero setup, and the data is still there tomorrow.

## Install & run

```
npm install
npm start
```

The server starts on `http://localhost:3000` and creates `tasks.db` automatically on first
run — a fresh clone works with no manual database setup. Interactive docs (Swagger UI) are at
`http://localhost:3000/docs`.

## Endpoints

| Method | Path         | Description                        | Success | Errors        |
|--------|--------------|-------------------------------------|---------|----------------|
| GET    | `/`          | API description                     | 200     | —              |
| GET    | `/health`    | Health check                        | 200     | —              |
| GET    | `/tasks`     | List all tasks                      | 200     | —              |
| GET    | `/tasks/:id` | Get one task                        | 200     | 404 unknown id |
| POST   | `/tasks`     | Create a task (`{ "title": "..." }`)| 201     | 400 missing/empty title |
| PUT    | `/tasks/:id` | Update a task's `title` and/or `done` | 200   | 400 invalid body · 404 unknown id |
| DELETE | `/tasks/:id` | Delete a task                       | 204     | 404 unknown id |

## Example — curl -i

```
$ curl -i http://localhost:3000/tasks/1
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40

{"id":1,"title":"Buy milk","done":false}
```

## Swagger UI

`/docs` lists every endpoint and supports "Try it out" for the full CRUD cycle.

_Screenshot: add one here after clicking through the full CRUD cycle in `/docs`._

## SQL by hand

`tasks.db` can be opened directly in [DB Browser for SQLite](https://sqlitebrowser.org/) — its
"Execute SQL" tab talks to the exact same file the API reads, so a change made there shows up
in `GET /tasks` immediately, no server restart needed. One query run this way:

```sql
UPDATE tasks SET done = 1 WHERE id = 2;
```

Result: `GET /tasks` immediately showed task 2 (`"Walk the dog"`) with `"done": true` — proof
that the API and DB Browser are two windows onto the same data, not two separate copies.

_Screenshot: add one here of `tasks.db` open in DB Browser for SQLite._

## Persistence, proven

Create a few tasks, restart the server, then `GET /tasks` again — the new tasks are still
there. In Assignment 1, storage was an in-memory JavaScript array that lived in the process's
RAM and was thrown away the moment the process exited, so a restart was indistinguishable from
wiping the database. Now storage is a file on disk (`tasks.db`), so the process can stop and
start as many times as it likes — the data outlives it. That's the entire point of a database,
and the API layer (routes, validation, status codes) didn't have to change at all to get it.
