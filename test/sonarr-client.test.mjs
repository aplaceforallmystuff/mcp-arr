import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { SonarrClient } from "../dist/arr-client.js";

test("addSeries uses the first Sonarr v3 language profile when none is provided", async () => {
  const requests = [];
  const mock = await startMockSonarr(async (req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.method === "GET" && req.url === "/api/v3/languageprofile") {
      return sendJson(res, 200, [{ id: 7, name: "English" }, { id: 8, name: "French" }]);
    }
    if (req.method === "POST" && req.url === "/api/v3/series") {
      const body = await readJson(req);
      assert.equal(body.languageProfileId, 7);
      return sendJson(res, 201, { ...body, id: 42, year: 2020, path: "/tv/Example" });
    }
    sendJson(res, 404, { error: "not found" });
  });

  try {
    const client = new SonarrClient({ url: mock.url, apiKey: "test-key" });
    const added = await client.addSeries({
      tvdbId: 123,
      title: "Example",
      qualityProfileId: 1,
      rootFolderPath: "/tv",
    });

    assert.equal(added.id, 42);
    assert.deepEqual(requests, [
      "GET /api/v3/languageprofile",
      "POST /api/v3/series",
    ]);
  } finally {
    await mock.close();
  }
});

test("addSeries uses an explicit language profile without fetching profiles", async () => {
  const requests = [];
  const mock = await startMockSonarr(async (req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.method === "POST" && req.url === "/api/v3/series") {
      const body = await readJson(req);
      assert.equal(body.languageProfileId, 12);
      return sendJson(res, 201, { ...body, id: 43, year: 2021, path: "/tv/Example" });
    }
    sendJson(res, 404, { error: "not found" });
  });

  try {
    const client = new SonarrClient({ url: mock.url, apiKey: "test-key" });
    await client.addSeries({
      tvdbId: 124,
      title: "Example",
      qualityProfileId: 1,
      languageProfileId: 12,
      rootFolderPath: "/tv",
    });

    assert.deepEqual(requests, ["POST /api/v3/series"]);
  } finally {
    await mock.close();
  }
});

test("addSeries omits languageProfileId when the Sonarr v4 endpoint is unavailable", async () => {
  const requests = [];
  const mock = await startMockSonarr(async (req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.method === "GET" && req.url === "/api/v3/languageprofile") {
      return sendJson(res, 404, { error: "Not Found" });
    }
    if (req.method === "POST" && req.url === "/api/v3/series") {
      const body = await readJson(req);
      assert.equal(Object.hasOwn(body, "languageProfileId"), false);
      return sendJson(res, 201, { ...body, id: 44, year: 2022, path: "/tv/Example" });
    }
    sendJson(res, 404, { error: "not found" });
  });

  try {
    const client = new SonarrClient({ url: mock.url, apiKey: "test-key" });
    await client.addSeries({
      tvdbId: 125,
      title: "Example",
      qualityProfileId: 1,
      rootFolderPath: "/tv",
    });

    assert.deepEqual(requests, [
      "GET /api/v3/languageprofile",
      "POST /api/v3/series",
    ]);
  } finally {
    await mock.close();
  }
});

async function startMockSonarr(handler) {
  const server = createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch((error) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
