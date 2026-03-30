import fs from 'fs';
import path from 'path';
import os from 'os';

const TOKEN_DIR = path.join(os.homedir(), '.time-tracker');
const TOKEN_FILE = path.join(TOKEN_DIR, 'wave-tokens.json');

interface WaveTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms
}

export function readTokens(): WaveTokens | null {
  try {
    const raw = fs.readFileSync(TOKEN_FILE, 'utf-8');
    return JSON.parse(raw) as WaveTokens;
  } catch {
    return null;
  }
}

export function writeTokens(tokens: WaveTokens): void {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function deleteTokens(): void {
  try {
    fs.unlinkSync(TOKEN_FILE);
  } catch {
    // File doesn't exist, that's fine
  }
}

export async function getValidToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  // If token hasn't expired yet (with 60s buffer), return it
  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }

  // Try to refresh
  const clientId = process.env.WAVE_CLIENT_ID;
  const clientSecret = process.env.WAVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://api.waveapps.com/oauth2/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      console.error('Token refresh failed:', res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const newTokens: WaveTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? tokens.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    writeTokens(newTokens);
    return newTokens.access_token;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}
