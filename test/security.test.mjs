import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Runs dist/index.js against a local stub with a dummy key, so no real
// service is contacted. Build first: npm run build
const DUMMY_KEY = "dummy-key-0123456789";
const services = ["SONARR", "RADARR", "LIDARR", "PROWLARR"];

let stub;
let baseUrl;
let requests = [];
const openClients = [];

before(async () => {
  stub = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/fail")) {
      res.statusCode = 500;
      res.end(`upstream echoed ${DUMMY_KEY} and /api?apikey=${DUMMY_KEY}`);
      return;
    }
    res.end(req.url.includes("/series") ? "[]" : "{}");
  });
  await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${stub.address().port}`;
});

after(async () => {
  await Promise.all(openClients.map((client) => client.close()));
  stub.close();
});

async function connect(env = {}) {
  const serviceEnv = {};
  for (const service of services) {
    serviceEnv[`${service}_URL`] = baseUrl;
    serviceEnv[`${service}_API_KEY`] = DUMMY_KEY;
  }
  const client = new Client({ name: "security-test", version: "1.0.0" });
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    env: { PATH: process.env.PATH, MCP_TRANSPORT: "stdio", ...serviceEnv, ...env },
    stderr: "ignore",
  }));
  openClients.push(client);
  return client;
}

async function call(client, name, args) {
  requests = [];
  const result = await client.callTool({ name, arguments: args });
  return { ...result, text: result.content[0].text, requests };
}

test("a path-traversal queueId is rejected before any request", async () => {
  const client = await connect();
  const result = await call(client, "radarr_delete_queue_item", { queueId: "../downloadclient/5" });
  assert.equal(result.isError, true);
  assert.match(result.text, /queueId must be an integer/);
  assert.deepEqual(result.requests, []);
});

test("a valid queueId still reaches the queue endpoint", async () => {
  const client = await connect();
  const result = await call(client, "radarr_delete_queue_item", { queueId: 5 });
  assert.notEqual(result.isError, true, result.text);
  assert.deepEqual(result.requests, ["DELETE /api/v3/queue/5?removeFromClient=true"]);
});

test("invalid arguments are rejected before any request", async () => {
  const client = await connect();
  const attacks = [
    ["sonarr_get_episodes", { seriesId: "1&x=y" }],
    ["sonarr_get_episodes", { seriesId: 1, seasonNumber: -1 }],
    ["radarr_refresh_movie", { movieId: 0 }],
    ["radarr_refresh_movie", { movieId: -1 }],
    ["radarr_refresh_movie", { movieId: 1.5 }],
    ["radarr_refresh_movie", { movieId: 2 ** 53 }],
    ["radarr_refresh_movie", {}],
    ["radarr_delete_queue_item", { queueId: 5, blocklist: "false" }],
    ["sonarr_search_episode", { episodeIds: [1, "../tag/1"] }],
    ["sonarr_get_episode_files", { seriesId: 1, fields: "everything" }],
    ["sonarr_get_episode_releases", { episodeId: 1, limit: 101 }],
    ["lidarr_get_albums", { artistId: "../system/status" }],
  ];
  for (const [name, args] of attacks) {
    const result = await call(client, name, args);
    assert.equal(result.isError, true, `${name} ${JSON.stringify(args)}`);
    assert.match(result.text, /Invalid arguments/, `${name} ${JSON.stringify(args)}`);
    assert.deepEqual(result.requests, [], `${name} ${JSON.stringify(args)}`);
  }
});

test("list limits keep clamping instead of rejecting", async () => {
  const client = await connect();
  const result = await call(client, "sonarr_get_series", { limit: 500 });
  assert.notEqual(result.isError, true, result.text);
  assert.equal(JSON.parse(result.text).limit, 100);
});

test("existing confirmation guards still apply", async () => {
  const client = await connect();
  const result = await call(client, "radarr_grab_release", { movieId: 1, indexerId: 8, guid: "x" });
  assert.equal(result.isError, true);
  assert.deepEqual(result.requests, []);
});

test("malformed service URLs stop startup without printing the key", () => {
  for (const url of ["192.168.1.5:8989", "localhost:8989", "ftp://example.test"]) {
    const result = spawnSync(process.execPath, ["dist/index.js"], {
      env: { PATH: process.env.PATH, SONARR_URL: url, SONARR_API_KEY: DUMMY_KEY },
      input: "",
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, 1, url);
    assert.match(result.stderr, /SONARR_URL must be/);
    assert.ok(!result.stderr.includes(DUMMY_KEY), url);
    assert.ok(!result.stdout.includes(DUMMY_KEY), url);
  }
});

test("API keys are redacted from error text", async () => {
  const client = await connect({ SONARR_URL: `${baseUrl}/fail` });
  const result = await call(client, "sonarr_get_series", {});
  assert.equal(result.isError, true);
  assert.match(result.text, /\[REDACTED\]/);
  assert.ok(!result.text.includes(DUMMY_KEY));
});

test("pathId accepts positive integers only", async () => {
  const { pathId } = await import("../dist/security.js");
  assert.equal(pathId(42), "42");
  for (const id of ["5", "../downloadclient/5", 0, -1, 1.5, Number.NaN, 2 ** 53]) {
    assert.throws(() => pathId(id), /positive integer/, String(id));
  }
});
