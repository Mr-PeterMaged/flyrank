const { db } = require('./db');

function getReportData() {
  const { totalBooks } = db.prepare('SELECT COUNT(*) AS totalBooks FROM books').get();

  const { averagePrice } = db.prepare('SELECT AVG(price) AS averagePrice FROM books').get();

  const topExpensive = db
    .prepare('SELECT title, price, url FROM books ORDER BY price DESC LIMIT 5')
    .all();

  const byRating = db
    .prepare('SELECT rating, COUNT(*) AS count FROM books GROUP BY rating ORDER BY rating DESC')
    .all();

  const allBooks = db.prepare('SELECT title, price, rating, url FROM books ORDER BY title').all();

  return { totalBooks, averagePrice, topExpensive, byRating, allBooks };
}

module.exports = { getReportData };
