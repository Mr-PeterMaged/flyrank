const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:3000';
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));

async function runCase(testCase) {
  const res = await fetch(`${BASE_URL}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: testCase.text }),
  });

  if (res.status !== 200) {
    return { ...testCase, pass: false, got: null, note: `HTTP ${res.status}` };
  }

  const got = await res.json();
  const pass = got.category === testCase.expected.category;
  return { ...testCase, pass, got };
}

async function main() {
  const results = [];
  for (const testCase of cases) {
    results.push(await runCase(testCase));
  }

  const passed = results.filter((r) => r.pass).length;

  for (const r of results) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    console.log(`${mark} ${r.id} -> expected ${r.expected.category}, got ${r.got?.category ?? r.note}`);
  }
  console.log(`\nScore: ${passed}/${cases.length} on category`);

  fs.writeFileSync(
    path.join(__dirname, 'results.json'),
    JSON.stringify({ date: new Date().toISOString(), score: `${passed}/${cases.length}`, results }, null, 2)
  );
}

main();
