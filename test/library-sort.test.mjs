import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';

const library = [
  { id: 1, title: 'Bravo', year: 2001, added: '2025-01-03T00:00:00Z' },
  { id: 2, title: 'alpha', year: 2003, added: '2026-11-04T00:00:00Z' },
  { id: 3, title: 'Charlie', year: 2002, added: '2026-10-28T00:00:00Z' },
];

for (const [service, tool, key] of [['sonarr', 'sonarr_get_series', 'series'], ['radarr', 'radarr_get_movies', 'movies']]) {
  test(`${tool} sorts before paginating and reports added dates`, async () => {
    const f = await fixture(service, () => library);
    try {
      const unsorted = data(await f.call(tool, {}));
      assert.deepEqual(unsorted[key].map(r => r.id), [1, 2, 3]);
      assert.equal(unsorted.sort, null);
      assert.equal(unsorted.order, null);

      const newest = data(await f.call(tool, { sort: 'added', limit: 2 }));
      assert.deepEqual(newest[key].map(r => r.id), [2, 3]);
      assert.equal(newest[key][0].added, '2026-11-04T00:00:00Z');
      assert.equal(newest.order, 'desc');
      assert.equal(newest.hasMore, true);

      const byTitle = data(await f.call(tool, { sort: 'title' }));
      assert.deepEqual(byTitle[key].map(r => r.id), [2, 1, 3]);
      assert.equal(byTitle.order, 'asc');

      const oldestYear = data(await f.call(tool, { sort: 'year', order: 'asc', offset: 1, limit: 1 }));
      assert.deepEqual(oldestYear[key].map(r => r.id), [3]);
    } finally { await f.close(); }
  });

  test(`${tool} rejects unknown sort values before requesting`, async () => {
    const f = await fixture(service, () => library);
    try {
      for (const args of [{ sort: 'size' }, { sort: 'added', order: 'newest' }]) {
        assert.equal((await f.call(tool, args)).isError, true);
      }
      assert.equal(f.calls.length, 0);
    } finally { await f.close(); }
  });
}
