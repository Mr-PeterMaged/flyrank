const { inngest } = require('./client');
const { reports } = require('../reports-store');

const sayHello = inngest.createFunction(
  { id: 'say-hello', triggers: { event: 'test/hello' } },
  async ({ step }) => {
    await step.sleep('wait-a-bit', '5s');
    return 'Hello from the background!';
  }
);

const makeReport = inngest.createFunction(
  {
    id: 'make-report',
    triggers: { event: 'report/requested' },
    retries: 2,
    onFailure: async ({ event }) => {
      const { id } = event.data.event.data;
      const report = reports.get(id);
      if (report) {
        report.status = 'failed';
      }
    },
  },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep('do-the-slow-work', '8s');

    const result = await step.run('build-report', async () => {
      if (topic === 'fail') {
        throw new Error('The report oven is broken!');
      }
      return `Report on "${topic}": everything looks great. Generated after 8 seconds of hard work.`;
    });

    const report = reports.get(id);
    if (report) {
      report.status = 'done';
      report.result = result;
    }

    return result;
  }
);

const heartbeat = inngest.createFunction(
  { id: 'heartbeat', triggers: { cron: '* * * * *' } },
  async () => {
    const all = [...reports.values()];
    const pending = all.filter((r) => r.status === 'pending').length;
    const done = all.filter((r) => r.status === 'done').length;
    const failed = all.filter((r) => r.status === 'failed').length;
    console.log(`heartbeat: pending=${pending} done=${done} failed=${failed}`);
    return { pending, done, failed };
  }
);

module.exports = { sayHello, makeReport, heartbeat };
