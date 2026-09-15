/**
 * Client half of Define / Explain.
 *
 * There is no API key here, and there must never be one: this is a static Vite
 * bundle, so anything it imports ships to every visitor in readable form. The
 * key lives only in the serverless function at `api/define.js`, which this
 * calls.
 */

/** Matches the caps in api/define.js, so an over-long selection fails here. */
const MAX_SUBJECT = 400;

export async function askAboutSelection({ mode, subject, context, title }) {
  const trimmed = (subject ?? '').trim();
  if (!trimmed) throw new Error('Nothing selected.');
  if (trimmed.length > MAX_SUBJECT) {
    throw new Error('That selection is too long — pick a shorter phrase.');
  }

  let response;
  try {
    response = await fetch('/api/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, subject: trimmed, context, title }),
    });
  } catch {
    throw new Error('Could not reach the server. Are you offline?');
  }

  // `pnpm dev` is Vite alone and does not serve /api, so the SPA rewrite hands
  // back index.html. Say that plainly instead of "unexpected token <".
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) {
    throw new Error('Define needs the API running — use `vercel dev` locally.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed (${response.status}).`);
  }
  if (!data?.text) throw new Error('No answer came back.');
  return data.text;
}
