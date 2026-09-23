# Background Report Jobs

**Designed and developed by [Peter Maged](https://petermaged.com/).**

Explore asynchronous report processing with queued execution and workflow observability.

## Product and technical overview

- **Implementation:** Node.js, Express 5, Inngest, process-local report status.
- **Deployment:** Vercel frontend with an external backend; [DEPLOYMENT.md](DEPLOYMENT.md) contains exact settings and operational requirements.
- **Ownership:** Peter Maged's project implementation; third-party libraries and upstream materials retain their attribution.
- **License:** [LICENSE](LICENSE). Available for portfolio review, evaluation and further development under these terms.

For project enquiries and implementation work: [petermaged.com](https://petermaged.com/).

## Engineering guide and existing evidence

# Background job

A small API with one slow task — an 8-second "report" — built to prove the pattern behind every
"we'll email you when it's ready": accept the request instantly, do the slow work in the
background, and let the client poll a status endpoint until it's done. One cron job runs on a
clock alone, with no request involved.

Built for FlyRank Internship · Backend Track · W4 · Assignment A7, using
[Inngest](https://www.inngest.com/) for background jobs and cron, running entirely on this
machine (no account, no card).

## Install & run

Two terminals, two commands.

```
# terminal 1 — the API
cd background-job
npm install
INNGEST_DEV=1 npm start

# terminal 2 — the Inngest Dev Server (dashboard)
cd background-job
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

The API is on `http://localhost:3000`. The dashboard is at `http://localhost:8288` — open it to
watch runs, retries, and the cron ticks live.

`INNGEST_DEV=1` matters: without it the SDK assumes production/cloud mode and every call to
`/api/inngest` 500s with "no signing key found."

## Endpoints & functions

| Method | Path            | Description                              | Success | Errors |
|--------|-----------------|-------------------------------------------|---------|--------|
| GET    | `/health`       | Health check                               | 200     | —      |
| POST   | `/reports`      | Accept a report request, work happens later | 202 + `{id, status}` | 400 missing topic |
| GET    | `/reports/:id`  | Poll a report's status                     | 200 `pending`/`done`/`failed` | 404 unknown id |

| Function | Trigger | What it does |
|---|---|---|
| `say-hello` | event `test/hello` | Sleeps 5s, returns a greeting — the "hello world" of background jobs |
| `make-report` | event `report/requested` | Sleeps 8s (stand-in for slow work), builds the report, saves `done`; on `topic: "fail"` it throws and retries twice before an `onFailure` handler marks the report `failed` |
| `heartbeat` | cron `* * * * *` | No request, no event — runs every minute and logs how many reports are `pending`/`done`/`failed` |

## Proof — 202 now, done ~8s later

```
$ time curl -i -X POST http://localhost:3000/reports -H "Content-Type: application/json" -d '{"topic":"cats"}'
HTTP/1.1 202 Accepted
{"id":"a8ae7140-1794-4524-af14-8f66b150f9c8","status":"pending"}
real  0m0.070s

$ curl -s http://localhost:3000/reports/a8ae7140-1794-4524-af14-8f66b150f9c8
{"id":"a8ae7140-1794-4524-af14-8f66b150f9c8","topic":"dogs","status":"pending"}

# ~8 seconds later:
$ curl -s http://localhost:3000/reports/a8ae7140-1794-4524-af14-8f66b150f9c8
{"id":"a8ae7140-1794-4524-af14-8f66b150f9c8","topic":"dogs","status":"done","result":"Report on \"dogs\": everything looks great. Generated after 8 seconds of hard work."}
```

The `POST` answers in 70 milliseconds even though the work behind it takes 8 seconds — because
the endpoint never does the work itself, it only accepts the request and sends an event.

## Dashboard

_Screenshot: add one here of `http://localhost:8288` showing a completed `make-report` run with
its steps, a `Failed` run with its 3 attempts, and two `heartbeat` cron ticks._

Equivalent evidence, gathered from the Dev Server's own API (what the dashboard reads from):

- `make-report` (`topic: "fail"`) → `{"status":"Failed", "output":{"message":"The report oven is broken!", ...}}`, reached after 3 attempts (`"atts":2,"maxAtts":3` on the queued retry job — 1 original + `retries: 2`).
- Two `heartbeat` log lines one minute apart: `heartbeat: pending=2 done=0 failed=0` then `heartbeat: pending=1 done=1 failed=0`.

## Stage 3 — why retries and validation are different

A retry is for a wrong *moment* (a network hiccup, a service that's briefly down) — trying again
a second later might succeed. A `400` is for a wrong *input* (a missing `topic`) — trying the
exact same bad request again will never succeed, so `POST /reports` rejects it at the door and
never sends an event, meaning it never spends a background job on something that was never going
to work.

## Stage 4 — reading cron

Using [crontab.guru](https://crontab.guru/):

- **Every day at 08:00:** `0 8 * * *`
- **Every Sunday at 22:00:** `0 22 * * 0`

(Servers usually run cron in UTC — worth checking before trusting a schedule against a local
clock.)

## Idempotency, and why jobs must survive running twice

`make-report`'s `build-report` step only ever gets one chance to run per attempt, but the event
that triggers it could in principle be sent twice (a retried request, a duplicate webhook). If it
were sent twice with the same report `id`, the naive code above would just overwrite the same
`done` report with the same result a second time — harmless here because the work is
side-effect-free per call. Jobs that email someone or charge a card need a real guard (e.g.
checking `report.status === 'done'` before doing the work at all) so "ran twice" and "ran once"
produce the same outcome — that's what idempotency buys you, and it's why a job system that
guarantees at-least-once delivery (not exactly-once) is still safe to build on.
