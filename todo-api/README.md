# Task API

A small CRUD API for a to-do list, built with Node.js and Express. Data is kept in memory
(no database) — it's seeded with 3 example tasks on startup and lost when the server restarts.

Built for FlyRank Internship · Backend Track · W2 · Assignment A1.

## Install & run

```
npm install
npm start
```

The server starts on `http://localhost:3000`. Interactive docs (Swagger UI) are at
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

## The mortality experiment

Create a few tasks, restart the server, then `GET /tasks` again — the new tasks are gone; only
the 3 seeded tasks remain. That's because storage is an in-memory JavaScript array: it lives in
the process's RAM and is thrown away the moment the process exits. Nothing persists it to disk,
so restarting the server is indistinguishable from wiping the database — which is exactly the
problem a real database solves.
