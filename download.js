/* =============================================================================
   /api/download — função serverless (roda na Vercel, não no navegador)
   -----------------------------------------------------------------------------
   Esta função existe para esconder sua chave da SocialKit. O site (index.html)
   chama ESTA rota (/api/download), e é só aqui, no servidor, que a chave real
   é lida e usada. Ninguém que visitar o site consegue ver essa chave.

   Configuração necessária na Vercel:
   1. No painel do seu projeto, vá em Settings → Environment Variables
   2. Crie uma variável chamada SOCIALKIT_ACCESS_KEY com o valor da sua chave
   3. Faça um novo deploy para a variável entrar em vigor
   ============================================================================= */

const ENDPOINTS = {
  tiktok:    'https://api.socialkit.dev/tiktok/download',
  instagram: 'https://api.socialkit.dev/instagram/download',
  youtube:   'https://api.socialkit.dev/youtube/download',
  facebook:  'https://api.socialkit.dev/facebook/download',
  twitter:   'https://api.socialkit.dev/twitter/download',
};

export default async function handler(req, res) {
  // Permite chamadas vindas do próprio site (ajuste se hospedar em domínio próprio)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Método não permitido. Use POST.' });
    return;
  }

  const { platform, url, format = 'mp4', quality = '720p' } = req.body || {};

  if (!url) {
    res.status(400).json({ success: false, message: 'O campo "url" é obrigatório.' });
    return;
  }

  const target = ENDPOINTS[platform];
  if (!target) {
    res.status(400).json({ success: false, message: `Plataforma "${platform}" não suportada.` });
    return;
  }

  const accessKey = process.env.SOCIALKIT_ACCESS_KEY;
  if (!accessKey) {
    res.status(500).json({
      success: false,
      message: 'Chave da API não configurada no servidor. Defina SOCIALKIT_ACCESS_KEY nas variáveis de ambiente do projeto na Vercel.'
    });
    return;
  }

  try {
    const apiResponse = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: accessKey, url, format, quality }),
    });

    const data = await apiResponse.json();
    res.status(apiResponse.status).json(data);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Não foi possível contatar o serviço de download agora.' });
  }
}
