# Task API

A CRUD API for a to-do list, built with Node.js and Express, backed by a PostgreSQL database
running in Docker, and secured with [Supabase Auth](https://supabase.com/auth): sign up, log in,
log out, and JWT-protected routes. The whole stack — app and database — starts with one command.

Built for FlyRank Internship · Backend Track · W2 (A1, A2, A4) and W1 (Assignment A3).

## Storage history

The storage layer has moved three times while the API on top never changed:

| Assignment | Where tasks live | What runs it |
|------------|-------------------|--------------|
| A1 | a list in memory | the Node process |
| A2 | a `tasks.db` file | SQLite, on disk |
| A3 (this) | rows in `tasks` | Postgres, in a Docker container |

## Install & run

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Podman).

```
cp .env.example .env
docker compose up
```

That single command builds the app image, starts a Postgres 16 container with a named volume
(`taskdata`), waits for the database to report healthy, then starts the API — which creates the
`tasks` table and seeds 3 example tasks on first run. The API is on `http://localhost:3000`,
Swagger UI at `http://localhost:3000/docs`.

`.env` holds `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY` and `PORT`, and is git-ignored;
`.env.example` is the committed template with placeholder values — no real credentials ever
reach the repo. To get your own Supabase values: create a free project at
[supabase.com](https://supabase.com), then copy **Project Settings → API → Project URL** and the
**anon / publishable key** (never the `service_role` / secret key — that one bypasses all
security and must never leave the server). For this practice project, also turn off
**Authentication → Sign In / Up → Email → Confirm email**, so a fresh signup can log in
immediately without clicking a confirmation link.

### Running the app outside Docker

With Postgres reachable at `localhost:5432` (e.g. `docker compose up db`):

```
npm install
npm start
```

`npm start` reads `.env` via Node's `--env-file` flag.

## Why Postgres in Docker

Postgres runs as its own server process, the same engine behind a large share of real backends
(FlyRank included) — a step up from A2's single-file SQLite database. Docker means nobody
installs or configures Postgres by hand: `docker compose up` pulls the official `postgres:16`
image and runs it identically on any machine. (Pinned to `16` rather than `latest`: Postgres 18
changed the image's data directory layout to a single mount at `/var/lib/postgresql`, which
breaks the `/var/lib/postgresql/data` volume path this project — and the assignment — uses.)

The database's healthcheck (`pg_isready`) plus the API's `depends_on: condition: service_healthy`
stops a real race condition: without it, the API container starts before Postgres is ready to
accept connections and exits immediately on `ECONNREFUSED`.

## Auth

Supabase is the identity provider: it stores accounts, hashes passwords, and signs JSON Web
Tokens (JWTs). This API never touches a password or does any cryptography itself — it forwards
credentials to Supabase and verifies the tokens Supabase hands back.

```
Client → Supabase        (POST /auth/signup, /auth/login: email + password)
Supabase → Client        (a signed JWT access token)
Client → this API        (Authorization: Bearer <token>)
this API → Supabase      (supabase.auth.getUser(token) — "is this real?")
```

`auth-middleware.js` is the single reusable guard (`requireAuth`): it extracts the bearer token,
asks Supabase to verify it, and either attaches `req.user` and calls `next()`, or short-circuits
with a `401`. It's applied to every protected route below — adding a new protected route is one
line, with zero new auth code.

## Endpoints

| Method | Path                    | Description                          | Auth required | Success | Errors |
|--------|-------------------------|---------------------------------------|:---:|---------|--------|
| POST   | `/auth/signup`          | Create a new user account             | — | 201 | 400 missing email/password |
| POST   | `/auth/login`           | Authenticate, return a JWT            | — | 200 | 400 missing input · 401 bad credentials |
| POST   | `/auth/logout`          | End the session                       | ✓ | 204 | 401 missing/invalid token |
| GET    | `/public/info`          | Open, unauthenticated data            | — | 200 | — |
| GET    | `/protected/profile`    | The verified user's id/email/created_at | ✓ | 200 | 401 missing/invalid token |
| GET    | `/protected/dashboard`  | Second route reusing the same guard   | ✓ | 200 | 401 missing/invalid token |
| GET    | `/`                     | API description                       | — | 200 | — |
| GET    | `/health`               | Health check                          | — | 200 | — |
| GET    | `/tasks`                | List all tasks                        | — | 200 | — |
| GET    | `/tasks/:id`            | Get one task                          | — | 200 | 404 unknown id |
| POST   | `/tasks`                | Create a task (`{ "title": "..." }`)  | — | 201 | 400 missing/empty title |
| PUT    | `/tasks/:id`            | Update a task's `title` and/or `done` | — | 200 | 400 invalid body · 404 unknown id |
| DELETE | `/tasks/:id`            | Delete a task                         | — | 204 | 404 unknown id |

All SQL queries use parameterized placeholders (`$1`, `$2`, …) — no request value is ever glued
into a SQL string.

## Example — the full auth flow via curl -i

```
$ curl -i -X POST http://localhost:3000/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"you@example.com","password":"password123"}'
HTTP/1.1 201 Created
...

$ curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"you@example.com","password":"password123"}'
{"access_token":"eyJ...","refresh_token":"..."}

$ curl -i http://localhost:3000/protected/profile \
    -H "Authorization: Bearer eyJ..."
HTTP/1.1 200 OK
{"id":"...","email":"you@example.com","created_at":"..."}

$ curl -i http://localhost:3000/protected/profile \
    -H "Authorization: Bearer eyJ...tampered"
HTTP/1.1 401 Unauthorized
{"error":"Invalid or expired token"}
```

## Swagger UI

`/docs` lists every endpoint and supports "Try it out" for the full CRUD cycle. Protected routes
show a lock icon; click **Authorize**, paste an `access_token` from `/auth/login`, and every
subsequent "Try it out" call sends it automatically — no curl needed.

_Screenshot: add one here after authorizing and calling `GET /protected/profile` from `/docs`._

## Data in the database

```
$ docker exec todo-api-db-1 psql -U postgres -d tasks -c "\dt"
 Schema | Name  | Type  |  Owner
--------+-------+-------+----------
 public | tasks | table | postgres

$ docker exec todo-api-db-1 psql -U postgres -d tasks -c "SELECT * FROM tasks;"
 id |    title     | done
----+--------------+------
  1 | Buy milk     | f
  2 | Walk the dog | f
  3 | Write README | t
```

_Screenshot: add one here of the `tasks` table (psql output above, or a GUI like pgAdmin /
DBeaver / TablePlus)._

## Persistence, proven

Create a task, then `docker compose down` followed by `docker compose up` — the task is still
there, because `taskdata` is a named volume: it lives outside the container's filesystem and
outlives `down` removing the container. Only `docker compose down -v` (or `docker volume rm`)
deletes it. Each storage swap so far has traded a weaker kind of persistence for a stronger one:
memory (gone on any restart) → a file on disk (gone if the file is deleted) → a volume attached
to a real database server (survives container removal, and is how production databases are
actually run).
