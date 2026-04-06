export default async function handler(req, res) {
  return res.status(200).json({
    appKey: process.env.VTEX_APP_KEY ? 'OK' : 'MISSING',
    appToken: process.env.VTEX_APP_TOKEN ? 'OK' : 'MISSING',
    account: process.env.VTEX_ACCOUNT || 'MISSING'
  });
}
