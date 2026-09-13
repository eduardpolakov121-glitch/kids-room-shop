module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const webhook = process.env.ORDER_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({error:'ORDER_WEBHOOK_URL is not configured'});
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({error:'Webhook rejected order', details:text.slice(0,300)});
    }
    return res.status(200).json({ok:true});
  } catch (e) {
    return res.status(500).json({error:'Order forwarding failed'});
  }
};
