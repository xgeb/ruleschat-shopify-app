export const chunkText = (text, options = {}) => {
  const { maxWords = 120 } = options;
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  for (let i = 0; i < words.length; i += maxWords) {
    const slice = words.slice(i, i + maxWords);
    if (slice.length === 0) {
      continue;
    }
    chunks.push(slice.join(' '));
  }

  return chunks;
};

const tokenize = (text) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );

export const scoreChunk = (query, chunk) => {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(chunk);
  let score = 0;

  queryTokens.forEach((token) => {
    if (chunkTokens.has(token)) {
      score += 1;
    }
  });

  return score;
};

export const retrieveRelevantChunks = (query, chunks) => {
  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(query, chunk.content),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score);
};
