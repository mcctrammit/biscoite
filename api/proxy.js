// api/proxy.js - Vercel Serverless Function

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Pegar variáveis de ambiente
        const VTEX_ACCOUNT = process.env.VTEX_ACCOUNT;
        const VTEX_APP_KEY = process.env.VTEX_APP_KEY;
        const VTEX_APP_TOKEN = process.env.VTEX_APP_TOKEN;

        // Validar credenciais
        if (!VTEX_ACCOUNT || !VTEX_APP_KEY || !VTEX_APP_TOKEN) {
            console.error('Variáveis de ambiente faltando');
            return res.status(500).json({ 
                error: 'Configuração incompleta',
                details: 'Variáveis VTEX não configuradas'
            });
        }

        // Pegar o path da query string
        const { path } = req.query;
        
        if (!path) {
            return res.status(400).json({ 
                error: 'Path obrigatório',
                example: '/api/proxy?path=/list/orders?f_creationDate=...'
            });
        }

        // Montar URL completa da VTEX
        const vtexUrl = `https://${VTEX_ACCOUNT}.vtexcommercestable.com.br/api/oms/pvt${path}`;

        console.log('Fazendo requisição para:', vtexUrl);

        // Fazer requisição para VTEX
        const vtexResponse = await fetch(vtexUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-VTEX-API-AppKey': VTEX_APP_KEY,
                'X-VTEX-API-AppToken': VTEX_APP_TOKEN
            }
        });

        // Pegar resposta
        const data = await vtexResponse.json();

        // Log para debug
        console.log('Status VTEX:', vtexResponse.status);
        console.log('Dados recebidos:', data.list ? `${data.list.length} pedidos` : 'sem lista');

        // Retornar resposta
        if (!vtexResponse.ok) {
            return res.status(vtexResponse.status).json({
                error: 'Erro na API VTEX',
                status: vtexResponse.status,
                data: data
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro no proxy:', error);
        return res.status(500).json({ 
            error: 'Erro interno',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
