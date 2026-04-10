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
            console.error('Variáveis de ambiente faltando:', {
                hasAccount: !!VTEX_ACCOUNT,
                hasKey: !!VTEX_APP_KEY,
                hasToken: !!VTEX_APP_TOKEN
            });
            return res.status(500).json({ 
                error: 'Configuração incompleta',
                details: 'Variáveis VTEX não configuradas. Verifique VTEX_ACCOUNT, VTEX_APP_KEY e VTEX_APP_TOKEN'
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

        console.log('=== Requisição VTEX ===');
        console.log('URL:', vtexUrl);
        console.log('Method:', req.method);
        console.log('Account:', VTEX_ACCOUNT);

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

        console.log('Status VTEX:', vtexResponse.status);
        console.log('Status Text:', vtexResponse.statusText);

        // Pegar o texto da resposta primeiro
        const responseText = await vtexResponse.text();
        console.log('Response length:', responseText.length);
        console.log('Response preview:', responseText.substring(0, 200));

        // Se não for OK, retornar erro com mais detalhes
        if (!vtexResponse.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText };
            }

            console.error('Erro VTEX:', errorData);

            return res.status(vtexResponse.status).json({
                error: 'Erro na API VTEX',
                status: vtexResponse.status,
                statusText: vtexResponse.statusText,
                data: errorData,
                url: vtexUrl.replace(VTEX_APP_TOKEN, '***') // Não expor token no log
            });
        }

        // Tentar parsear JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Dados parseados com sucesso');
            console.log('Tipo de resposta:', Array.isArray(data) ? 'Array' : typeof data);
            if (data.list) {
                console.log('Lista de pedidos:', data.list.length, 'itens');
            }
        } catch (e) {
            console.error('Erro ao parsear JSON:', e.message);
            return res.status(500).json({
                error: 'Resposta inválida da VTEX',
                details: 'Não foi possível parsear JSON',
                preview: responseText.substring(0, 500)
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('=== Erro no proxy ===');
        console.error('Tipo:', error.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);

        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            type: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
