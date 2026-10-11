/**
 * Optional Cloudflare Worker proxy for the portfolio chat.
 *
 * The static site does not call this unless data/profile.json sets
 * chat.llm.enabled to true and chat.llm.endpoint to this Worker's URL.
 * Keep the model API key in a Worker secret. Never put it in the repo.
 *
 * Expected POST JSON: { question, context, profile }
 * Response JSON: { answer }
 *
 * Setup (from the workers/ directory, after `npm i -g wrangler` or `npx wrangler`):
 *   cp wrangler.toml.example wrangler.toml
 *   npx wrangler secret put LLM_API_KEY
 *   npx wrangler deploy
 * Then set chat.llm.endpoint to the deployed https URL and chat.llm.enabled to true.
 */

const DEFAULT_ORIGIN = "https://nazmulislam-lab.github.io";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "POST JSON { question, context } to this worker." }, 405, cors);
    }

    if (!isAllowedOrigin(origin, allowed)) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    if (!env.LLM_API_KEY) {
      return json({ error: "LLM_API_KEY is not set on the worker." }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Expected JSON." }, 400, cors);
    }

    const question = String(body.question || "").slice(0, 500).trim();
    if (!question) return json({ error: "Missing question." }, 400, cors);

    const context = typeof body.context === "string" ? body.context.slice(0, 8000) : "";
    const profile = body.profile ? JSON.stringify(body.profile).slice(0, 20000) : "";
    const base = (env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = env.LLM_MODEL || "gpt-4o-mini";

    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You answer questions about Md Nazmul Islam for visitors to his personal site. Use only the profile JSON and the local context. If a fact is missing or marked TODO, say you do not know. Do not invent employers, dates, degrees, or contact details."
          },
          {
            role: "user",
            content: `Question: ${question}\n\nLocal answer:\n${context}\n\nProfile JSON:\n${profile}`
          }
        ]
      })
    });

    if (!upstream.ok) {
      return json({ error: "Upstream model request failed." }, 502, cors);
    }

    const data = await upstream.json();
    const answer = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    if (!answer) return json({ error: "Model returned an empty answer." }, 502, cors);
    return json({ answer }, 200, cors);
  }
};

function isAllowedOrigin(origin, allowed) {
  if (!origin) return false;
  if (origin === allowed) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return true;
  return false;
}

function corsHeaders(origin, allowed) {
  const ok = isAllowedOrigin(origin, allowed);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
