export default async function handler(req, res) {
  try {
    const { path, query } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const base = `https://${process.env.VTEX_ACCOUNT}.vtexcommercestable.com.br`;
    const url = `${base}${path}${query ? `?${query}` : ''}`;

    // DEBUG: loga a URL final para diagnóstico (remover após confirmar funcionamento)
    console.log('[proxy] URL →', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-VTEX-API-AppKey': process.env.VTEX_APP_KEY,
        'X-VTEX-API-AppToken': process.env.VTEX_APP_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // DEBUG: loga status de resposta
    console.log('[proxy] status ←', response.status);

    const text = await response.text();

    res.status(response.status).send(text);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
