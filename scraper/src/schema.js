const { z } = require('zod');

const BookRecord = z.object({
  title: z.string().min(1),
  product_url: z.url(),
  price_text: z.string().min(1),
  price_gbp: z.number().positive(),
  availability_text: z.string().min(1),
  rating_text: z.string().nullable(),
  description: z.string().nullable(),
  source_page: z.url(),
  fetched_at: z.iso.datetime(),
});

module.exports = { BookRecord };
