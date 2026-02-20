const CONFIG_SCRIPT_URL = process.env.CONFIG_SCRIPT_URL || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!CONFIG_SCRIPT_URL) {
    return res.status(500).json({ error: 'CONFIG_SCRIPT_URL not set in Vercel env' });
  }

  if (req.method === 'GET') {
    try {
      const r = await fetch(CONFIG_SCRIPT_URL);
      const text = await r.text();
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(502).json({ error: 'Failed to load config from Google' });
    }
  }

  if (req.method === 'POST') {
    if (!ADMIN_SECRET) {
      return res.status(500).json({ error: 'ADMIN_SECRET not set in Vercel env' });
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { return res.status(400).json({ error: 'Invalid JSON' }); }
    }
    if (!body || body.secret !== ADMIN_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const payload = {
      secret: ADMIN_SECRET,
      eventTitle: body.eventTitle != null ? String(body.eventTitle) : '',
      goingNum: body.goingNum != null ? Number(body.goingNum) : 0,
      goingPlus: body.goingPlus != null ? Number(body.goingPlus) : 0,
      interestingNum: body.interestingNum != null ? Number(body.interestingNum) : 0,
      interestingPlus: body.interestingPlus != null ? Number(body.interestingPlus) : 0
    };
    try {
      const formBody = 'data=' + encodeURIComponent(JSON.stringify(payload));
      const r = await fetch(CONFIG_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      const text = await r.text();
      if (text && text.toUpperCase().indexOf('OK') !== -1) {
        return res.status(200).setHeader('Content-Type', 'text/plain').send('OK');
      }
      return res.status(400).setHeader('Content-Type', 'text/plain').send(text || 'Error');
    } catch (e) {
      return res.status(502).json({ error: 'Failed to save config to Google' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
