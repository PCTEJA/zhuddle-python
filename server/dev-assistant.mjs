import { loadEnv } from 'vite';
import { handleAssistant } from './assistant.mjs';

export default function assistantDev() {
  return { name: 'zhuddle-assistant-dev', configureServer(server) {
    const env = { ...loadEnv(server.config.mode, server.config.root, ''), ...process.env };
    server.middlewares.use('/api/assistant', async (req, res) => {
      try {
        const request = new Request('http://127.0.0.1:4321/api/assistant', {
          method: req.method, headers: req.headers,
          ...(!['GET', 'HEAD'].includes(req.method) ? { body: req, duplex: 'half' } : {}),
        });
        const response = await handleAssistant(request, { env, clientIp: req.socket.remoteAddress });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
      } catch { res.writeHead(500); res.end('{"error":"Assistant unavailable."}'); }
    });
  } };
}
