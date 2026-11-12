import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';

const candidate = {
  path: '/downloads/movie.mkv', size: 2000, movie: { id: 42 },
  quality: { quality: { id: 19 }, revision: { version: 1 } },
  languages: [{ id: 1, name: 'English' }], downloadId: 'download-42', rejections: [],
};
const selection = { path: candidate.path, movieId: 42, expectedSizeBytes: 2000 };
const input = { downloadId: 'download-42', files: [selection], importMode: 'copy', confirmed: true };

test('manual import omitted/false confirmation and invalid selections cause zero requests', async () => {
  const f = await fixture('radarr', () => [candidate]);
  const { confirmed, ...unconfirmed } = input;
  try {
    for (const args of [unconfirmed, { ...input, confirmed: false }, { ...input, confirmed: 'true' },
      { ...input, importMode: undefined }, { ...input, files: [] },
      { ...input, files: [selection, selection] },
      { ...input, files: [selection, { ...selection, path: '/downloads/other.mkv' }] }]) {
      assert.equal((await f.call('radarr_manual_import', args)).isError, true);
    }
    assert.equal(f.calls.length, 0);
  } finally { await f.close(); }
});

test('fresh candidate changes, substantive overrides and ambiguity never POST', async () => {
  let current = [];
  const f = await fixture('radarr', () => current);
  try {
    const cases = [
      [{ ...candidate, size: 2001 }, /file changed/],
      [{ ...candidate, movie: { id: 99 } }, /mapping/],
      [{ ...candidate, path: '/downloads/other.mkv' }, /missing or ambiguous/],
      [{ ...candidate, languages: [{ id: -1 }] }, /unknown quality or languages/],
      [{ ...candidate, quality: { quality: { id: -1 } } }, /unknown quality or languages/],
      [{ ...candidate, downloadId: 'changed' }, /download ID changed/],
      [{ ...candidate, rejections: [{ reason: 'Wrong language' }] }, /substantive/],
      [{ ...candidate, rejections: [{ reason: 'Not an upgrade: wrong language' }] }, /substantive/],
    ];
    for (const [record, message] of cases) {
      current = [record];
      const files = [{ ...selection, acknowledgedRejections: record.rejections.map(r => r.reason) }];
      const result = await f.call('radarr_manual_import', { ...input, files });
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, message);
    }
    current = [candidate, candidate];
    assert.match((await f.call('radarr_manual_import', input)).content[0].text, /ambiguous/);
    current = [{ ...candidate, rejections: [{ reason: 'Not an upgrade' }] }];
    assert.equal((await f.call('radarr_manual_import', input)).isError, true);
    assert.equal((await f.call('radarr_manual_import', { ...input, files: [{ ...selection, acknowledgedRejections: ['Existing file meets cutoff'] }] })).isError, true);
    assert.equal(f.calls.some(c => c.method === 'POST'), false);
  } finally { await f.close(); }
});

test('all import modes submit fresh metadata and report only a queued command', async () => {
  const fresh = { ...candidate, rejections: [{ reason: 'Not an upgrade' }] };
  const f = await fixture('radarr', call => call.method === 'GET' ? [fresh] : { id: 123, status: 'queued' });
  try {
    for (const importMode of ['copy', 'move', 'auto']) {
      const result = data(await f.call('radarr_manual_import', {
        ...input, importMode,
        files: [{ ...selection, quality: { quality: { id: 999 } }, languages: [{ id: 999 }], acknowledgedRejections: ['Not an upgrade'] }],
      }));
      assert.equal(result.submitted, true);
      assert.equal(result.imported, false);
      assert.equal(result.command.status, 'queued');
      assert.match(result.nextStep, /movie files/);
      assert.equal(f.calls.at(-2).method, 'GET');
      const submitted = f.calls.at(-1);
      assert.equal(submitted.method, 'POST');
      assert.equal(submitted.path, '/api/v3/command');
      assert.equal(submitted.body.name, 'ManualImport');
      assert.equal(submitted.body.importMode, importMode);
      assert.deepEqual(submitted.body.files[0].quality, fresh.quality);
      assert.deepEqual(submitted.body.files[0].languages, fresh.languages);
    }
  } finally { await f.close(); }
});

test('ambiguous command submission is redacted and is never retried', async () => {
  const f = await fixture('radarr', call => {
    if (call.method === 'GET') return [candidate];
    throw new Error('possibly accepted before failure');
  });
  try {
    const result = await f.call('radarr_manual_import', input);
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private-upstream-detail/);
    assert.match(result.content[0].text, /current state before retrying/);
    assert.equal(f.calls.filter(c => c.method === 'POST').length, 1);
  } finally { await f.close(); }
});
