import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('tools register only for the configured service', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, () => []);
    try {
      const names = (await f.client.listTools()).tools.map(t => t.name);
      for (const name of ["radarr_get_manual_import_candidates", "radarr_manual_import", "radarr_get_command"]) assert.equal(names.includes(name), name.startsWith(service + '_'), name);
    } finally { await f.close(); }
  }
});
test('manual import submits a command without claiming completed import', async () => {
  const candidate = { path: '/downloads/movie.mkv', size: 2000, movie: { id: 42 }, quality: { quality: { id: 19 } }, languages: [{ id: 1, name: 'English' }], rejections: [] };
  const f = await fixture('radarr', c => c.path.includes('/manualimport?') ? [candidate] : { id: 123, status: 'queued' });
  try {
    const result = data(await f.call('radarr_manual_import', { folder: '/downloads', files: [{ path: candidate.path, movieId: 42, expectedSizeBytes: 2000 }], importMode: 'copy', confirmed: true }));
    assert.equal(result.submitted, true);
    assert.equal(result.imported, false);
    assert.equal(result.command.id, 123);
    assert.equal(f.calls.at(-1).path, '/api/v3/command');
    assert.equal(data(await f.call('radarr_get_command', { commandId: 123 })).status, 'queued');
  } finally { await f.close(); }
});
test('service errors do not expose raw API response bodies', async () => {
  const f = await fixture('radarr', () => { throw new Error('private'); });
  try {
    const result = await f.call("radarr_get_command",{"commandId": 1});
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
  } finally { await f.close(); }
});
