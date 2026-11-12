import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('tools register only for the configured service', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const f = await fixture(service, () => []);
    try {
      const names = (await f.client.listTools()).tools.map(t => t.name);
      for (const name of ["sonarr_grab_release", "radarr_grab_release"]) assert.equal(names.includes(name), name.startsWith(service + '_'), name);
    } finally { await f.close(); }
  }
});
test('exact grabs require confirmation and fresh eligible identifiers', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const idKey = service === 'sonarr' ? 'episodeId' : 'movieId';
    const tool = service + '_grab_release';
    let release = { guid: 'chosen', indexerId: 8, downloadAllowed: true };
    const f = await fixture(service, call => call.method === 'GET' ? [release] : { id: 1 });
    const args = { [idKey]: 42, indexerId: 8, guid: 'chosen', confirmed: true };
    try {
      const { confirmed, ...unconfirmed } = args;
      for (const input of [unconfirmed, { ...args, confirmed: false }, { ...args, confirmed: 'true' }]) {
        assert.equal((await f.call(tool, input)).isError, true);
      }
      assert.equal(f.calls.length, 0);
      assert.equal((await f.call(tool, { ...args, guid: 'other' })).isError, true);
      release.downloadAllowed = false;
      assert.equal((await f.call(tool, args)).isError, true);
      release.downloadAllowed = true;
      release.rejections = ['Password protected'];
      assert.equal((await f.call(tool, args)).isError, true);
      assert.equal(f.calls.some(c => c.method === 'POST'), false);
      assert.equal((await f.call(tool, { ...args, acknowledgedRejections: ['Password protected'] })).isError, true);
      release.rejections = ['Existing file meets cutoff: Remux-2160p'];
      assert.equal((await f.call(tool, args)).isError, true);
      assert.equal((await f.call(tool, { ...args, acknowledgedRejections: ['Not an upgrade'] })).isError, true);
      assert.equal(data(await f.call(tool, { ...args, acknowledgedRejections: release.rejections })).grabbed, true);
      release.rejections = [];
      assert.equal(data(await f.call(tool, args)).grabbed, true);
      assert.deepEqual(f.calls.at(-1).body, { guid: 'chosen', indexerId: 8 });
      assert.match(f.calls.at(-2).path, new RegExp(idKey + '=42'));
    } finally { await f.close(); }
  }
});
test('service errors do not expose raw API response bodies', async () => {
  const f = await fixture('radarr', () => { throw new Error('private'); });
  try {
    const result = await f.call("radarr_grab_release",{"movieId": 1, "indexerId": 8, "guid": "x", "confirmed": true});
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
  } finally { await f.close(); }
});

for (const service of ['sonarr', 'radarr']) {
  test(service + ' refuses ambiguous candidates, unknown eligibility and unsafe override wording', async () => {
    const idKey = service === 'sonarr' ? 'episodeId' : 'movieId';
    const release = { guid: 'chosen', indexerId: 8, downloadAllowed: true };
    let releases = [release, release];
    const f = await fixture(service, () => releases);
    const args = { [idKey]: 42, indexerId: 8, guid: 'chosen', confirmed: true };
    try {
      assert.match((await f.call(service + '_grab_release', args)).content[0].text, /ambiguous/);
      releases = [{ guid: 'chosen', indexerId: 8 }];
      assert.equal((await f.call(service + '_grab_release', args)).isError, true);
      for (const reason of ['Not an upgrade: wrong language', 'Existing file meets cutoff: password protected']) {
        releases = [{ ...release, rejected: true, rejections: [reason] }];
        assert.equal((await f.call(service + '_grab_release', { ...args, acknowledgedRejections: [reason] })).isError, true);
      }
      releases = [{ ...release, rejections: ['Not an upgrade'] }];
      assert.equal((await f.call(service + '_grab_release', { ...args, acknowledgedRejections: ['Existing file meets cutoff'] })).isError, true);
      assert.equal(f.calls.some(c => c.method === 'POST'), false);
    } finally { await f.close(); }
  });
  test(service + ' does not retry an ambiguous release submission', async () => {
    const idKey = service === 'sonarr' ? 'episodeId' : 'movieId';
    const f = await fixture(service, call => {
      if (call.method === 'GET') return [{ guid: 'chosen', indexerId: 8, downloadAllowed: true }];
      throw new Error('upstream failed after possible acceptance');
    });
    try {
      const result = await f.call(service + '_grab_release', { [idKey]: 42, indexerId: 8, guid: 'chosen', confirmed: true });
      assert.equal(result.isError, true);
      assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
      assert.match(result.content[0].text, /current state before retrying/);
      assert.equal(f.calls.filter(c => c.method === 'POST').length, 1);
    } finally { await f.close(); }
  });
}
