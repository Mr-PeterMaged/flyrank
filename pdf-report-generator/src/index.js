const path = require('path');
const fs = require('fs');
const express = require('express');
const { db } = require('./db');
const { getReportData } = require('./report-data');
const { renderPdf } = require('./render-pdf');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/reports', async (req, res) => {
  const data = getReportData();
  const filePath = path.join(REPORTS_DIR, `${Date.now()}.pdf`);

  await renderPdf(data, filePath);

  const createdAt = new Date().toISOString();
  const { lastInsertRowid } = db
    .prepare('INSERT INTO reports (path, created_at) VALUES (?, ?)')
    .run(filePath, createdAt);

  res.status(201).json({ id: lastInsertRowid, file: `/reports/${lastInsertRowid}/file` });
});

app.get('/reports/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(Number(req.params.id));
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ id: report.id, created_at: report.created_at, file: `/reports/${report.id}/file` });
});

app.get('/reports/:id/file', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(Number(req.params.id));
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.sendFile(report.path);
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
