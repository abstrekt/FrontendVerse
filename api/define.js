/**
 * Define / Explain — the only server-side code in this project.
 *
 * It exists for one reason: the Groq API key must never reach the browser.
 * This is a static Vite SPA, so every `VITE_*` var and every imported module
 * is readable by anyone who opens devtools. Keeping the call here means the
 * key lives in `process.env` on Vercel and in `.env.local` (gitignored) for
 * `vercel dev`, and never in the bundle.
 *
 * Note that `pnpm dev` runs Vite alone and will not serve this route — use
 * `vercel dev` when you need Define locally.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Caps, so a stray paste cannot turn into a large bill. The client enforces
// the same subject limit; this is the half that actually matters.
const MAX_SUBJECT = 400;
const MAX_CONTEXT = 1500;

const PROMPTS = {
  define: {
    system:
      'You define technical terms for a senior frontend engineer preparing for interviews. ' +
      'Define the term strictly as it is used in the passage supplied, not in general. ' +
      'Two or three sentences, plain prose, no preamble, no markdown, no bullet points. ' +
      'If the passage uses the term in an unusual way, say so.',
    user: ({ subject, context, title }) =>
      `Entry: "${title}"\n\nPassage:\n"""\n${context}\n"""\n\nDefine this term as used above: "${subject}"`,
  },
  explain: {
    system:
      'You re-explain sentences from technical writing to a senior frontend engineer who ' +
      'understands the area but found this particular line dense. Rewrite it in plainer ' +
      'words and say why it matters, using the surrounding passage for context. ' +
      'Three sentences at most, plain prose, no preamble, no markdown, no bullet points.',
    user: ({ subject, context, title }) =>
      `Entry: "${title}"\n\nSurrounding passage:\n"""\n${context}\n"""\n\nExplain this sentence more simply: "${subject}"`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not set on the server.',
    });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const mode = body?.mode === 'explain' ? 'explain' : 'define';
  const subject = String(body?.subject ?? '').trim().slice(0, MAX_SUBJECT);
  const context = String(body?.context ?? '').trim().slice(0, MAX_CONTEXT);
  const title = String(body?.title ?? '').trim().slice(0, 200);

  if (!subject) return res.status(400).json({ error: 'Nothing to look up.' });

  const prompt = PROMPTS[mode];

  try {
    const groq = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        temperature: 0.2,
        // Generous, because the gpt-oss models spend tokens on reasoning
        // before they emit anything; 220 truncated answers mid-sentence. The
        // prompts cap the actual length, not this.
        max_tokens: 700,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user({ subject, context, title }) },
        ],
      }),
    });

    if (!groq.ok) {
      // Surface the status but not the provider's body — it can echo request
      // details, and this response goes to the browser.
      const detail = groq.status === 429 ? 'Rate limited — try again shortly.' : null;
      return res.status(502).json({
        error: detail ?? `The model service returned ${groq.status}.`,
      });
    }

    const data = await groq.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(502).json({ error: 'The model returned nothing.' });

    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: 'Could not reach the model service.' });
  }
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
