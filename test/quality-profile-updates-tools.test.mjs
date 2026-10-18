import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('tools register only for the configured service', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, () => []);
    try {
      const names = (await f.client.listTools()).tools.map(t => t.name);
      for (const name of ["sonarr_update_quality_profile", "radarr_update_quality_profile"]) assert.equal(names.includes(name), name.startsWith(service + '_'), name);
    } finally { await f.close(); }
  }
});
test('profile preview preserves unrelated settings and apply requires identity', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const original = { id: 4, name: 'UHD', upgradeAllowed: false, cutoff: 19, items: [{ id: 19, allowed: true }], formatItems: [], minFormatScore: 0, cutoffFormatScore: 0 };
    const f = await fixture(service, c => c.path.endsWith('/customformat') ? [{ id: 9, name: 'Surround' }] : c.method === 'PUT' ? c.body : original);
    const tool = service + '_update_quality_profile';
    try {
      assert.equal((await f.call(tool, { profileId: 4, apply: true, upgradeAllowed: true })).isError, true);
      assert.equal((await f.call(tool, { profileId: 4, formatScores: [null] })).isError, true);
      assert.equal(f.calls.length, 0);
      const preview = data(await f.call(tool, { profileId: 4, upgradeAllowed: true, formatScores: [{ formatId: 9, score: 100 }] }));
      assert.equal(preview.applied, false);
      assert.deepEqual(preview.original, original);
      assert.deepEqual(preview.proposed.items, original.items);
      assert.equal(preview.proposed.formatItems[0].score, 100);
      assert.equal(f.calls.some(c => c.method === 'PUT'), false);
      assert.equal((await f.call(tool, { profileId: 4, expectedName: 'wrong', apply: true, upgradeAllowed: true })).isError, true);
      assert.equal(f.calls.some(c => c.method === 'PUT'), false);
      const result = data(await f.call(tool, { profileId: 4, expectedName: 'UHD', apply: true, upgradeAllowed: true }));
      assert.equal(result.applied, true);
      assert.deepEqual(result.original, original);
      assert.deepEqual(f.calls.at(-1).body.items, original.items);
    } finally { await f.close(); }
  }
});
test('service errors do not expose raw API response bodies', async () => {
  const f = await fixture('radarr', () => { throw new Error('private'); });
  try {
    const result = await f.call("radarr_update_quality_profile",{"profileId": 1, "upgradeAllowed": true});
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
  } finally { await f.close(); }
});
