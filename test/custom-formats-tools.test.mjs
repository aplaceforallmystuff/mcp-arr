import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('tools register only for the configured service', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, () => []);
    try {
      const names = (await f.client.listTools()).tools.map(t => t.name);
      for (const name of ["sonarr_get_custom_formats", "radarr_get_custom_formats", "sonarr_create_custom_format", "radarr_create_custom_format"]) assert.equal(names.includes(name), name.startsWith(service + '_'), name);
    } finally { await f.close(); }
  }
});
test('custom format creation previews by default and rejects duplicate names', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, c => c.method === 'GET' ? [{ id: 1, name: 'Existing' }] : { ...c.body, id: 2 });
    const tool = service + '_create_custom_format';
    const args = { name: 'New', specifications: [{ name: 'Surround', implementation: 'ReleaseTitleSpecification', fields: [{ name: 'value', value: 'DDP' }] }] };
    try {
      assert.equal(data(await f.call(tool, args)).applied, false);
      assert.equal(f.calls.some(c => c.method === 'POST'), false);
      assert.equal((await f.call(tool, { ...args, name: 'eXiStInG', apply: true })).isError, true);
      assert.equal(f.calls.some(c => c.method === 'POST'), false);
      assert.equal(data(await f.call(tool, { ...args, apply: true })).applied, true);
      assert.deepEqual(f.calls.at(-1).body.specifications, args.specifications);
      assert.equal(f.calls.at(-1).body.includeCustomFormatWhenRenaming, false);
    } finally { await f.close(); }
  }
});
test('service errors do not expose raw API response bodies', async () => {
  const f = await fixture('radarr', () => { throw new Error('private'); });
  try {
    const result = await f.call("radarr_get_custom_formats",{});
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
  } finally { await f.close(); }
});
