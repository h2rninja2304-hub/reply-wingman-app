// Vercel serverless function: POST /api/generate
// Body: { prompt: string, image: { mediaType: string, data: base64string } | null }
// Uses Google's Gemini API (free tier) — the key stays on the server, never sent to the browser.

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ code: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ code: "missing_key" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { prompt, image } = body || {};

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ code: "bad_request" });
    return;
  }

  const parts = [];
  if (image && image.data && image.mediaType) {
    parts.push({ inline_data: { mime_type: image.mediaType, data: image.data } });
  }
  parts.push({ text: prompt });

  let lastStatus = 500;
  let isRefusal = false;
  let isRateLimited = false;

  for (const model of MODELS) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

    try {
      const apiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
        }),
      });

      if (apiRes.status === 429) {
        isRateLimited = true;
        lastStatus = 429;
        continue;
      }

      if (!apiRes.ok) {
        lastStatus = apiRes.status;
        const errBody = await apiRes.json().catch(() => ({}));
        if (/safety|block/i.test(JSON.stringify(errBody))) {
          isRefusal = true;
          break;
        }
        console.error(`Gemini API error with ${model}:`, apiRes.status, errBody);
        continue;
      }

      const data = await apiRes.json();
      const candidate = (data.candidates || [])[0];

      if (!candidate || candidate.finishReason === "SAFETY") {
        res.status(200).json({ code: "refused", replies: [] });
        return;
      }

      const text = ((candidate.content && candidate.content.parts) || [])
        .map((p) => p.text || "")
        .join("\n")
        .trim();

      if (!text) {
        res.status(200).json({ code: "empty_completion", replies: [] });
        return;
      }

      const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
      let replies;
      try {
        const parsed = JSON.parse(cleaned);
        replies = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.replies) ? parsed.replies : null);
      } catch (e) {
        replies = null;
      }

      if (!replies) {
        res.status(200).json({ code: "invalid_json", replies: [] });
        return;
      }

      res.status(200).json({ replies });
      return;
    } catch (e) {
      console.error(`Fetch exception with ${model}:`, e);
    }
  }

  if (isRefusal) {
    res.status(400).json({ code: "refused" });
  } else if (isRateLimited) {
    res.status(429).json({ code: "rate_limited" });
  } else {
    res.status(lastStatus || 500).json({ code: "upstream_error" });
  }
};
