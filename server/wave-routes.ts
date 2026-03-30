import { Router } from 'express';
import { readTokens, writeTokens, deleteTokens, getValidToken } from './wave-token.js';

const router = Router();

// GET /api/wave/auth — Redirect to Wave OAuth
router.get('/auth', (_req, res) => {
  const clientId = process.env.WAVE_CLIENT_ID;
  const redirectUri = process.env.WAVE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Wave credentials not configured. Set WAVE_CLIENT_ID and WAVE_REDIRECT_URI in server/.env' });
    return;
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'account:read business:read invoice:write customer:read product:read',
  });

  res.redirect(`https://api.waveapps.com/oauth2/authorize/?${params}`);
});

// GET /api/wave/callback — OAuth callback, exchange code for tokens
router.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  const clientId = process.env.WAVE_CLIENT_ID;
  const clientSecret = process.env.WAVE_CLIENT_SECRET;
  const redirectUri = process.env.WAVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).json({ error: 'Wave credentials not configured' });
    return;
  }

  try {
    const tokenRes = await fetch('https://api.waveapps.com/oauth2/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token exchange failed:', tokenRes.status, errText);
      res.status(502).json({ error: 'Token exchange failed' });
      return;
    }

    const data = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    writeTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });

    res.redirect('/?wave=connected');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// POST /api/wave/graphql — Proxy GraphQL requests to Wave
router.post('/graphql', async (req, res) => {
  const token = await getValidToken();
  if (!token) {
    res.status(401).json({ error: 'Not connected to Wave. Please authenticate first.' });
    return;
  }

  try {
    const waveRes = await fetch('https://gql.waveapps.com/graphql/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await waveRes.json();
    res.status(waveRes.status).json(data);
  } catch (err) {
    console.error('Wave GraphQL proxy error:', err);
    res.status(502).json({ error: 'Failed to reach Wave API' });
  }
});

// GET /api/wave/status — Check connection status
router.get('/status', (_req, res) => {
  const tokens = readTokens();
  res.json({ connected: tokens !== null });
});

// POST /api/wave/disconnect — Remove stored tokens
router.post('/disconnect', (_req, res) => {
  deleteTokens();
  res.json({ connected: false });
});

export default router;
