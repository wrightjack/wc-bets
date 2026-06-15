export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { home, away } = req.body;

    const url =
      "https://api.the-odds-api.com/v4/sports/soccer/odds/" +
      "?apiKey=" + process.env.ODDS_API_KEY +
      "&regions=uk&markets=h2h" +
      "&bookmakers=bet365,williamhill,betfair,paddypower,skybet,ladbrokes";

    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: "Odds API error" });

    const events = await response.json();
    const homeLower = home.toLowerCase().split(" ")[0];
    const awayLower = away.toLowerCase().split(" ")[0];

    const match = events.find((e) => {
      const h = e.home_team.toLowerCase();
      const a = e.away_team.toLowerCase();
      return h.includes(homeLower) && a.includes(awayLower);
    });

    return res.status(200).json(match || null);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
