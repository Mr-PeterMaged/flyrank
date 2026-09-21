# Task API

A small CRUD API for a to-do list, built with Node.js and Express, backed by a PostgreSQL
database running in Docker. The whole stack — app and database — starts with one command.

Built for FlyRank Internship · Backend Track · W2 (A1, A2) and W1 (Assignment A3).

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

`.env` holds `DATABASE_URL` and is git-ignored; `.env.example` is the committed template with
placeholder values — no real credentials ever reach the repo.

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

All queries use parameterized placeholders (`$1`, `$2`, …) — no request value is ever glued into
a SQL string.

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
