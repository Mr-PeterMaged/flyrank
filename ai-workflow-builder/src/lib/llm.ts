import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_BASE_URL,
});

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

// Sends one decision-node prompt to the model and forces a YES/NO answer.
// Never returns anything else — an unparseable answer is treated as an error
// the caller must handle, not silently guessed into a direction.
export async function askYesNo(prompt: string): Promise<'YES' | 'NO'> {
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You answer decision questions with exactly one word: YES or NO. ' +
          'Never explain, never add punctuation, never say anything else.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim().toUpperCase() ?? '';

  if (raw.startsWith('YES')) return 'YES';
  if (raw.startsWith('NO')) return 'NO';

  throw new Error(`Model returned a non YES/NO answer: "${raw}"`);
}
