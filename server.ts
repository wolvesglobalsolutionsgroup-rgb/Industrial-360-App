import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleGeminiProxy } from './functions/src/index';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // CORS support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini Proxy API endpoints
  const proxyHandler = async (req: express.Request, res: express.Response) => {
    try {
      const result = await handleGeminiProxy(req.body || {});
      res.json(result);
    } catch (error: any) {
      console.error('Server Gemini Proxy Error:', error);
      res.status(500).json({ error: error?.message || 'Error executing Gemini request.' });
    }
  };

  app.post('/api/gemini/proxy', proxyHandler);
  app.post('/api/callGeminiProxy', proxyHandler);

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
