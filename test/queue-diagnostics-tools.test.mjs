import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, data } from './helpers/mock-mcp.mjs';
test('queue includes failed/import diagnostics and stable byte counts', async () => {
  for (const service of ['sonarr', 'radarr']) {
    const item = { id: 1, title: 'Movie', status: 'completed', trackedDownloadStatus: 'warning', trackedDownloadState: 'importPending', statusMessages: [{ title: 'Import blocked', messages: ['Not an upgrade'] }], downloadId: 'download-1', outputPath: '/downloads/movie', size: 200, sizeleft: 0 };
    const f = await fixture(service, () => ({ page: 1, pageSize: 25, totalRecords: 1, records: [item] }));
    try {
      const result = data(await f.call(service + '_get_queue', { limit: 25 }));
      const row = result.items[0];
      assert.ok(row, JSON.stringify(result));
      assert.deepEqual(row.statusMessages, item.statusMessages);
      assert.equal(row.downloadId, item.downloadId);
      assert.equal(row.outputPath, item.outputPath);
      assert.equal(row.sizeBytes, 200);
      assert.equal(row.sizeLeftBytes, 0);
      assert.equal(row.trackedDownloadState, 'importPending');
    } finally { await f.close(); }
  }
});
