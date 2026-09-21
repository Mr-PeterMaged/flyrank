const path = require('path');
const fs = require('fs');
const { db } = require('./db');

const RATING_WORDS = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };

function seed() {
  const booksPath = path.join(__dirname, '..', '..', 'scraper', 'output', 'books.json');
  const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));

  // Delete-then-insert, so running the seed twice leaves one clean copy, not two.
  db.exec('DELETE FROM books');

  const insert = db.prepare('INSERT INTO books (title, price, rating, url) VALUES (?, ?, ?, ?)');
  for (const book of books) {
    insert.run(book.title, book.price_gbp, RATING_WORDS[book.rating_text] ?? 0, book.product_url);
  }

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM books').get();
  console.log(`Seeded ${count} books.`);
}

seed();
