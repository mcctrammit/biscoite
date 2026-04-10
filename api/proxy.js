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

        console.log('=== DEBUG INÍCIO ===');
        console.log('VTEX_ACCOUNT:', VTEX_ACCOUNT);
        console.log('VTEX_APP_KEY existe:', !!VTEX_APP_KEY);
        console.log('VTEX_APP_TOKEN existe:', !!VTEX_APP_TOKEN);

        // Validar credenciais
        if (!VTEX_ACCOUNT || !VTEX_APP_KEY || !VTEX_APP_TOKEN) {
            console.error('Variáveis de ambiente faltando');
            return res.status(500).json({ 
                error: 'Configuração incompleta',
                details: 'Variáveis VTEX não configuradas',
                has_account: !!VTEX_ACCOUNT,
                has_key: !!VTEX_APP_KEY,
                has_token: !!VTEX_APP_TOKEN
            });
        }

        // Pegar o path da query string
        const { path } = req.query;
        
        console.log('Path recebido:', path);

        if (!path) {
            return res.status(400).json({ 
                error: 'Path obrigatório',
                example: '/api/proxy?path=/list/orders?f_creationDate=...'
            });
        }

        // Montar URL completa da VTEX
        const vtexUrl = `https://${VTEX_ACCOUNT}.vtexcommercestable.com.br/api/oms/pvt${path}`;

        console.log('URL VTEX completa:', vtexUrl);

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

        console.log('Status da resposta VTEX:', vtexResponse.status);
        console.log('Headers da resposta:', Object.fromEntries(vtexResponse.headers.entries()));

        // Pegar resposta em texto primeiro para debug
        const responseText = await vtexResponse.text();

        console.log('Tipo de conteúdo:', vtexResponse.headers.get('content-type'));
        console.log('Primeiros 500 caracteres da resposta:', responseText.substring(0, 500));

        // Tentar parsear como JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('JSON parseado com sucesso');
            console.log('Tem lista?', !!data.list);
            console.log('Quantidade de pedidos:', data.list ? data.list.length : 0);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError.message);
            return res.status(500).json({
                error: 'Resposta da VTEX não é JSON válido',
                vtexStatus: vtexResponse.status,
                vtexUrl: vtexUrl,
                contentType: vtexResponse.headers.get('content-type'),
                responsePreview: responseText.substring(0, 1000),
                parseError: parseError.message
            });
        }

        // Retornar resposta
        if (!vtexResponse.ok) {
            console.log('Resposta VTEX não OK:', vtexResponse.status);
            return res.status(vtexResponse.status).json({
                error: 'Erro na API VTEX',
                status: vtexResponse.status,
                data: data
            });
        }

        console.log('=== DEBUG FIM - SUCESSO ===');
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro geral no proxy:', error);
        return res.status(500).json({ 
            error: 'Erro interno',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
