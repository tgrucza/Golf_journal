// Phase 5 — Netlify serverless function.
// Receives the golfer's flat hole-by-hole CSV, sends it to the Anthropic API
// with a fixed coaching prompt, and returns the analysis text. The Anthropic
// API key lives only in Netlify's environment variables, never in the client.

const SYSTEM_PROMPT = `You are a golf coach reviewing a player's shot-by-shot round data, given as CSV.
Columns are: hole, par, score, fairway, approach, putts, penalty.
Write a short, direct coaching read: identify the 3 biggest scoring leaks with the evidence from the
data, and one concrete drill for each. Plain text only — no markdown, no asterisks, no headers — just
short paragraphs a golfer can read on their phone between holes.`;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let csv;
  try {
    ({ csv } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!csv || typeof csv !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing round data' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Coach analysis isn't configured yet." }) };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: csv }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Anthropic API error', data);
      return { statusCode: 502, body: JSON.stringify({ error: 'Coach analysis failed. Try again in a moment.' }) };
    }

    const text = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: text }),
    };
  } catch (e) {
    console.error('coach-analysis function error', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Coach analysis failed. Try again in a moment.' }) };
  }
};
