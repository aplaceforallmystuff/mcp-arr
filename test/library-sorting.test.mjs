import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';

// Library order differs from both sort keys so each assertion proves a sort happened.
const library = [
  { id: 1, title: 'Alpha', added: '2024-03-01T00:00:00Z', size: 300 },
  { id: 2, title: 'Bravo', added: '2022-01-01T00:00:00Z', size: 100 },
  { id: 3, title: 'Charlie', added: '2025-06-01T00:00:00Z', size: 500 },
  { id: 4, title: 'Delta', added: '2023-09-01T00:00:00Z', size: 200 },
];
const cases = [
  { service: 'sonarr', tool: 'sonarr_get_series', key: 'series', record: r => ({ id: r.id, title: r.title, added: r.added, statistics: { sizeOnDisk: r.size } }) },
  { service: 'radarr', tool: 'radarr_get_movies', key: 'movies', record: r => ({ id: r.id, title: r.title, added: r.added, sizeOnDisk: r.size }) },
];

for (const { service, tool, key, record } of cases) {
  test(`${tool} sorts before limit/offset pagination`, async () => {
    const f = await fixture(service, () => library.map(record));
    try {
      const ids = result => result[key].map(item => item.id);

      const unsorted = data(await f.call(tool, { limit: 2 }));
      assert.deepEqual(ids(unsorted), [1, 2]);
      assert.equal('sortBy' in unsorted, false);
      assert.equal('sortDir' in unsorted, false);

      const oldestFirst = data(await f.call(tool, { sortBy: 'dateAdded', limit: 2 }));
      assert.deepEqual(ids(oldestFirst), [2, 4]);
      assert.equal(oldestFirst.sortDir, 'asc');
      assert.equal(oldestFirst.nextOffset, 2);
      assert.deepEqual(ids(data(await f.call(tool, { sortBy: 'dateAdded', limit: 2, offset: 2 }))), [1, 3]);

      const largestFirst = data(await f.call(tool, { sortBy: 'sizeOnDisk', limit: 3 }));
      assert.deepEqual(ids(largestFirst), [3, 1, 4]);
      assert.equal(largestFirst.sortDir, 'desc');
      assert.deepEqual(ids(data(await f.call(tool, { sortBy: 'sizeOnDisk', sortDir: 'asc', limit: 1, offset: 1 }))), [4]);
      assert.deepEqual(ids(data(await f.call(tool, { sortBy: 'dateAdded', sortDir: 'desc', search: 'L', limit: 2 }))), [3, 1]);

      const before = f.calls.length;
      for (const args of [{ sortBy: 'title' }, { sortDir: 'asc' }, { sortBy: 'dateAdded', sortDir: 'up' }]) {
        assert.equal((await f.call(tool, args)).isError, true);
      }
      assert.equal(f.calls.length, before);
    } finally { await f.close(); }
  });
}
