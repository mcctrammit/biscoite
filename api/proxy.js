export default async function handler(req, res) {
  try {
    const url = `https://${process.env.VTEX_ACCOUNT}.vtexcommercestable.com.br/api/oms/pvt/orders`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-VTEX-API-AppKey': process.env.VTEX_APP_KEY,
        'X-VTEX-API-AppToken': process.env.VTEX_APP_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
