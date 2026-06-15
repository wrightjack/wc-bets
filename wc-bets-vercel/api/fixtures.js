export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { comp, date } = req.body;
    const url = "https://api.football-data.org/v4/competitions/" + comp + "/matches?dateFrom=" + date + "&dateTo=" + date;

    const response = await fetch(url, {
      headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY }
    });

    if (!response.ok) return res.status(response.status).json({ error: "Football API error" });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
