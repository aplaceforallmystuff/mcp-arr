import assert from "node:assert/strict";
import test from "node:test";

import { SonarrClient } from "../dist/arr-client.js";

// Build a SonarrClient whose network `request` is stubbed so we can inspect the
// exact body addSeries POSTs to Sonarr's /series endpoint without a real server.
function makeClient() {
  const client = new SonarrClient({ url: "http://sonarr.test", apiKey: "x" });
  let captured;
  // `request` is protected in TS but a plain method at runtime; shadow it on
  // the instance so addSeries' `this['request']` resolves to our stub.
  client.request = async (endpoint, options) => {
    captured = { endpoint, method: options.method, body: JSON.parse(options.body) };
    return {
      id: 1,
      title: "Test",
      year: 2020,
      path: "/tv/Test",
      monitored: captured.body.monitored,
      seasons: captured.body.seasons ?? [],
    };
  };
  return { client, get: () => captured };
}

const base = { tvdbId: 1, title: "T", qualityProfileId: 1, rootFolderPath: "/tv" };

test("addSeries: unchanged body when no season params (backward compatible)", async () => {
  const { client, get } = makeClient();
  await client.addSeries({ ...base });
  const { endpoint, method, body } = get();
  assert.equal(endpoint, "/series");
  assert.equal(method, "POST");
  assert.equal(body.monitored, true);
  assert.equal(body.seasonFolder, true);
  assert.deepEqual(body.addOptions, { searchForMissingEpisodes: true });
  assert.equal("seasons" in body, false);
});

test("addSeries: explicit seasons pin monitor=none so Sonarr honours them", async () => {
  const { client, get } = makeClient();
  const seasons = [
    { seasonNumber: 1, monitored: true },
    { seasonNumber: 2, monitored: false },
  ];
  await client.addSeries({ ...base, seasons });
  const { body } = get();
  assert.deepEqual(body.seasons, seasons);
  assert.equal(body.addOptions.monitor, "none");
  assert.equal(body.addOptions.searchForMissingEpisodes, true);
});

test("addSeries: explicit monitor mode is passed through and wins over the seasons default", async () => {
  const { client, get } = makeClient();
  await client.addSeries({
    ...base,
    monitor: "firstSeason",
    seasons: [{ seasonNumber: 1, monitored: true }],
  });
  const { body } = get();
  assert.equal(body.addOptions.monitor, "firstSeason");
});

test("addSeries: searchForMissingEpisodes can be disabled", async () => {
  const { client, get } = makeClient();
  await client.addSeries({ ...base, monitor: "none", searchForMissingEpisodes: false });
  const { body } = get();
  assert.equal(body.addOptions.searchForMissingEpisodes, false);
  assert.equal(body.addOptions.monitor, "none");
});

test("addSeries: control params never leak into the top-level body", async () => {
  const { client, get } = makeClient();
  await client.addSeries({ ...base, monitor: "firstSeason", searchForMissingEpisodes: false });
  const { body } = get();
  assert.equal("monitor" in body, false);
  assert.equal("searchForMissingEpisodes" in body, false);
});
