import { createServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export async function fixture(service, respond) {
  const calls = [];
  const api = createServer(async (req, res) => {
    let body = '';
    for await (const part of req) body += part;
    const call = { path: req.url, method: req.method, body: body ? JSON.parse(body) : undefined };
    calls.push(call);
    res.setHeader('Content-Type', 'application/json');
    try { res.end(JSON.stringify(await respond(call))); }
    catch { res.statusCode = 500; res.end(JSON.stringify({ message: 'private-upstream-detail' })); }
  });
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  const env = { ...process.env, MCP_TRANSPORT: 'stdio' };
  for (const name of ['SONARR', 'RADARR', 'LIDARR', 'PROWLARR']) {
    env[name + '_URL'] = '';
    env[name + '_API_KEY'] = '';
  }
  env[service.toUpperCase() + '_URL'] = `http://127.0.0.1:${api.address().port}`;
  env[service.toUpperCase() + '_API_KEY'] = 'test';
  const transport = new StdioClientTransport({ command: process.execPath, args: ['dist/index.js'], env, stderr: 'ignore' });
  const client = new Client({ name: 'contribution-test', version: '1.0.0' });
  try { await client.connect(transport); }
  catch (error) { await transport.close(); api.close(); throw error; }
  return {
    client, calls,
    async call(name, args = {}) { return client.callTool({ name, arguments: args }); },
    async close() { await client.close(); await new Promise(resolve => api.close(resolve)); },
  };
}
export function data(result) { return JSON.parse(result.content[0].text); }
