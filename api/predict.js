export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { home, away, competition } = body;

    const prompt =
      "You are a football analyst. Give a concise match prediction for " +
      home + " vs " + away + " in the " + (competition || "football") +
      ". Respond ONLY with a valid JSON object with these exact keys: " +
      "predicted_winner (must be exactly Home, Draw, or Away), " +
      "predicted_score (e.g. 2-1), " +
      "confidence (must be exactly Low, Medium, or High), " +
      "key_factors (array of 3 strings), " +
      "summary (2-3 sentence string). " +
      "No markdown, no backticks, no extra text. Only the JSON object.";

    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Gemini API error", details: data });

    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const prediction = JSON.parse(cleaned);

    return res.status(200).json({
      predicted_winner: prediction.predicted_winner || "Draw",
      predicted_score: prediction.predicted_score || "?-?",
      confidence: prediction.confidence || "Medium",
      key_factors: Array.isArray(prediction.key_factors) ? prediction.key_factors : ["No factors available"],
      summary: prediction.summary || "No analysis available."
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
