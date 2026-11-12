import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('tools register only for the configured service', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, () => []);
    try {
      const names = (await f.client.listTools()).tools.map(t => t.name);
      for (const name of ["sonarr_get_episode_files", "radarr_get_movie_files"]) assert.equal(names.includes(name), name.startsWith(service + '_'), name);
    } finally { await f.close(); }
  }
});
test('paginated read tools validate before requesting and expose full evidence', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const tool = service === 'sonarr' ? 'sonarr_get_episode_files' : 'radarr_get_movie_files';
    const idKey = service === 'sonarr' ? 'seriesId' : 'movieId';
    const records = [1, 2, 3].map(id => ({ id, size: 20000000000, sceneName: 'scene', mediaInfo: { videoCodec: 'HEVC', audioChannels: 6, resolution: '3840x2160' } }));
    const f = await fixture(service, () => records);
    try {
      for (const args of [{ [idKey]: 0 }, { [idKey]: '42' }, { [idKey]: 1, limit: 101 }, { [idKey]: 1, limit: 0 }, { [idKey]: 1, offset: -1 }, { [idKey]: 1, fields: 'unknown' }]) assert.equal((await f.call(tool, args)).isError, true);
      assert.equal(f.calls.length, 0);
      const result = data(await f.call(tool, { [idKey]: 42, limit: 1, offset: 1, fields: 'full' }));
      assert.equal(result.total, 3);
      assert.equal(result.returned, 1);
      assert.equal(result.hasMore, true);
      assert.equal(f.calls[0].method, 'GET');
      assert.equal(f.calls[0].path, service === 'sonarr' ? '/api/v3/episodefile?seriesId=42' : '/api/v3/moviefile?movieId=42');
      assert.equal(result.files[0].id, 2);
      assert.equal(result.files[0].mediaInfo.audioChannels, 6);
      assert.equal(result.files[0].sceneName, 'scene');
      const summary = data(await f.call(tool, { [idKey]: 42, limit: 1, offset: 2 }));
      assert.equal(summary.hasMore, false);
      assert.equal(summary.nextOffset, null);
      assert.equal(summary.files[0].sizeBytes, 20000000000);
      assert.equal(summary.files[0].videoCodec, 'HEVC');
    } finally { await f.close(); }
  }
});
test('service errors do not expose raw API response bodies', async () => {
  const f = await fixture('radarr', () => { throw new Error('private'); });
  try {
    const result = await f.call("radarr_get_movie_files",{"movieId": 1});
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
  } finally { await f.close(); }
});
