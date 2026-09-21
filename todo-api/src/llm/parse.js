// Models like to wrap JSON in a code fence, or add prose before/after it.
// Strip that noise and find the first {...} object.
function extractJson(text) {
  if (typeof text !== 'string') return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

module.exports = { extractJson };
