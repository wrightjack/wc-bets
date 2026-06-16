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

    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text:
          "You are a football analyst. Predict " + home + " vs " + away + " in " + (competition || "football") + ". " +
          "Reply with ONLY this JSON, no other text: " +
          "{\"predicted_winner\":\"Draw\",\"predicted_score\":\"1-1\",\"confidence\":\"Medium\",\"key_factors\":[\"factor1\",\"factor2\",\"factor3\"],\"summary\":\"Your analysis here.\"}"
        }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    });

    const raw = await response.text();
    
    if (!response.ok) {
      return res.status(200).json({
        predicted_winner: "Draw", predicted_score: "?-?", confidence: "Low",
        key_factors: ["API error: " + response.status], summary: raw.slice(0, 200)
      });
    }

    const data = JSON.parse(raw);
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const cleaned = text.replace(/```json|```/g, "").trim();

    let prediction;
    try {
      prediction = JSON.parse(cleaned);
    } catch(parseErr) {
      return res.status(200).json({
        predicted_winner: "Draw", predicted_score: "?-?", confidence: "Low",
        key_factors: ["Could not parse response"], summary: cleaned.slice(0, 300)
      });
    }

    return res.status(200).json({
      predicted_winner: prediction.predicted_winner || "Draw",
      predicted_score: prediction.predicted_score || "?-?",
      confidence: prediction.confidence || "Medium",
      key_factors: Array.isArray(prediction.key_factors) ? prediction.key_factors : ["No factors available"],
      summary: prediction.summary || "No analysis available."
    });

  } catch (e) {
    return res.status(200).json({
      predicted_winner: "Draw", predicted_score: "?-?", confidence: "Low",
      key_factors: ["Error: " + e.message], summary: "Something went wrong."
    });
  }
}
