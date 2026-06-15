export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { home, away, competition } = req.body;

    const prompt =
      "You are a football analyst. Give a concise match prediction for " +
      home + " vs " + away + " in the " + competition +
      ". Respond ONLY with a JSON object, no markdown, no backticks. Format: " +
      '{"predicted_winner":"Home|Draw|Away","predicted_score":"X-X","confidence":"Low|Medium|High","key_factors":["factor1","factor2","factor3"],"summary":"2-3 sentence analysis"}';

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    });

    const data = await response.json();
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
      ? data.candidates[0].content.parts[0].text : "";

    const prediction = JSON.parse(text.replace(/```json|```/g, "").trim());
    return res.status(200).json(prediction);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
