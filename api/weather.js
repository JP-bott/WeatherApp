// Vercel serverless function (ESM) to proxy OpenWeatherMap requests
// Reads the OPENWEATHERMAP_API_KEY from process.env (configured in Vercel dashboard)
export default async function handler(req, res) {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'city query parameter required' });

  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) return res.status(500).json({ error: 'OpenWeatherMap API key not configured on server' });

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }
    const data = await resp.json();
    // short caching on Vercel edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
