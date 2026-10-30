import { createServer } from 'node:http';
import aiBrief from '../netlify/functions/psg-ai-brief.mjs';

const HOST = '127.0.0.1';
const PORT = 9999;
const ROUTES = new Set([
  '/api/psg-ai-brief',
  '/.netlify/functions/psg-ai-brief',
]);

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', `http://${HOST}:${PORT}`);
    if (!ROUTES.has(url.pathname)) {
      outgoing.writeHead(404, { 'Content-Type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'Function route not found.' }));
      return;
    }

    const body = [];
    for await (const chunk of incoming) body.push(chunk);
    const payload = body.length ? Buffer.concat(body) : undefined;
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers,
      body: ['GET', 'HEAD'].includes(incoming.method || '') ? undefined : payload,
    });
    const response = await aiBrief(request);
    const responseBody = Buffer.from(await response.arrayBuffer());

    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(responseBody);
  } catch (error) {
    console.error('Local function failed:', error);
    outgoing.writeHead(500, { 'Content-Type': 'application/json' });
    outgoing.end(JSON.stringify({ error: 'The local function could not complete the request.' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Local AI function listening on http://${HOST}:${PORT}`);
});
