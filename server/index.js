import express from "express";
import nodeFetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "2mb" }));

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function callAnthropic({ system, user, maxTokens = 900, temperature = 0.7 }) {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  const fetchImpl = globalThis.fetch ?? nodeFetch;

  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.content?.find((c) => c?.type === "text")?.text ?? "";
  return text;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/roast", async (req, res) => {
  try {
    const resumeText = String(req.body?.resumeText ?? "").slice(0, 3000);
    if (!resumeText.trim()) return res.status(400).send("resumeText required");

    const system =
      "You are a brutally honest but genuinely helpful resume critic — like a witty career coach crossed with a roast comedian.";

    const user = `Analyze this resume and respond ONLY with valid JSON (no markdown, no backticks): 
{
  "overall_score": <integer 0-100>,
  "roast_lines": [<5-7 brutal but constructive strings>],
  "scores": {
    "impact": <integer 0-10>,
    "formatting": <integer 0-10>,
    "keywords": <integer 0-10>,
    "clarity": <integer 0-10>,
    "experience": <integer 0-10>
  },
  "top_roast": "<single best/funniest roast line, under 15 words>",
  "one_good_thing": "<the one thing they actually did right>"
}

Be genuinely witty and specific to their resume. Punch hard but help them improve.

RESUME:
${resumeText}`;

    const raw = await callAnthropic({ system, user, maxTokens: 900, temperature: 0.8 });

    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Last-ditch: extract first JSON object
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Model did not return JSON.");
      parsed = JSON.parse(m[0]);
    }

    res.json(parsed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).send("Failed to roast resume.");
  }
});

app.post("/api/rewrite", async (req, res) => {
  try {
    const resumeText = String(req.body?.resumeText ?? "").slice(0, 3000);
    if (!resumeText.trim()) return res.status(400).send("resumeText required");

    const system = "You are an elite resume writer for top-tier tech and business companies.";
    const user = `Rewrite this resume to be exceptional. Make it:
- Achievement-focused with strong metrics
- ATS-optimized with relevant keywords
- Clean, scannable formatting
- Confident and compelling throughout

Return the full rewritten resume as plain text only. No preamble.

ORIGINAL RESUME:
${resumeText}`;

    const rewriteText = await callAnthropic({ system, user, maxTokens: 1200, temperature: 0.5 });
    res.json({ rewriteText });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).send("Failed to rewrite resume.");
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

