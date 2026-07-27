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
    const allowedOrigins = ['https://industrial-360.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
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
      const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
      if (is429) {
        console.warn('Server Gemini Proxy Quota Limit Exceeded');
        res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
      } else {
        console.error('Server Gemini Proxy Error:', error);
        res.status(500).json({ error: error?.message || 'Error executing Gemini request.' });
      }
    }
  };

  app.post('/api/gemini/proxy', proxyHandler);
  app.post('/api/callGeminiProxy', proxyHandler);

  // Resend Email API Endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, html, event, portalLink } = req.body || {};
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!to || (!html && !subject)) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: to, subject, html' });
      }

      if (resendApiKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Industrial Control 360 <notificaciones@industrialcontrol360.com>',
          to: Array.isArray(to) ? to : [to],
          subject: subject || 'Notificación Operativa Industrial Control 360',
          html: html || `<p>Tiene una nueva actualización de su proyecto.</p><p><a href="${portalLink || '#'}">Acceder al Portal Cliente</a></p>`
        });
        return res.json({ success: true, data: emailResult });
      } else {
        console.log(`[EMAIL SIMULADO] Evento: ${event || 'notificacion'} | Para: ${to} | Asunto: ${subject}`);
        return res.json({
          success: true,
          simulated: true,
          message: 'Notificación registrada (configura RESEND_API_KEY en .env para entrega directa vía Resend)',
          details: { to, subject, event }
        });
      }
    } catch (err: any) {
      console.error('Error enviando email vía Resend:', err);
      return res.status(500).json({ error: err?.message || 'Error al procesar envío de correo' });
    }
  });

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
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
