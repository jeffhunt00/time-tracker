import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import waveRoutes from './wave-routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const PORT = process.env.PORT ?? 4000;
const DIST_DIR = path.join(__dirname, '..', 'dist');

const app = express();

// Parse JSON bodies for the GraphQL proxy
app.use(express.json());

// Wave API routes
app.use('/api/wave', waveRoutes);

// Serve static production build
app.use(express.static(DIST_DIR));

// SPA fallback — serve index.html for all non-file routes
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Time Tracker server running on http://localhost:${PORT}`);
});
