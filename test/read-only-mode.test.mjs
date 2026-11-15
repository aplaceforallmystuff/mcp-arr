import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// All four services point at a local stub, so every tool is listed and any
// request that slips through is recorded instead of reaching a real service.
let api;
let requests = [];

before(async () => {
  api = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    res.setHeader("Content-Type", "application/json");
    res.end("{}");
  });
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
});

after(() => api.close());

async function connect(readOnly) {
  const env = { PATH: process.env.PATH, MCP_TRANSPORT: "stdio" };
  for (const service of ["SONARR", "RADARR", "LIDARR", "PROWLARR"]) {
    env[`${service}_URL`] = `http://127.0.0.1:${api.address().port}`;
    env[`${service}_API_KEY`] = "test";
  }
  if (readOnly) env.ARR_READ_ONLY = readOnly;
  const client = new Client({ name: "read-only-test", version: "1.0.0" });
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    env,
    stderr: "ignore",
  }));
  return client;
}

async function writeToolNames() {
  const client = await connect();
  try {
    const { tools } = await client.listTools();
    return tools.filter((tool) => tool.annotations.readOnlyHint === false).map((tool) => tool.name);
  } finally {
    await client.close();
  }
}

test("ARR_READ_ONLY=true hides every write tool from tools/list", async () => {
  const writeTools = await writeToolNames();
  for (const name of ["sonarr_grab_release", "radarr_grab_release", "radarr_manual_import", "radarr_delete_queue_item"]) {
    assert.ok(writeTools.includes(name), name);
  }

  const client = await connect("true");
  try {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    assert.ok(names.includes("sonarr_get_series"));
    assert.ok(names.includes("radarr_get_command"));
    for (const tool of tools) {
      assert.equal(tool.annotations.readOnlyHint, true, tool.name);
    }
    for (const name of writeTools) {
      assert.ok(!names.includes(name), name);
    }
  } finally {
    await client.close();
  }
});

test("ARR_READ_ONLY=true refuses write tools without contacting the service", async () => {
  const writeTools = await writeToolNames();
  const client = await connect("true");
  try {
    requests = [];
    for (const name of writeTools) {
      const result = await client.callTool({ name, arguments: {} });
      assert.equal(result.isError, true, name);
      assert.match(result.content[0].text, /ARR_READ_ONLY/, name);
    }
    const grab = await client.callTool({
      name: "radarr_grab_release",
      arguments: { movieId: 1, indexerId: 8, guid: "x", confirmed: true },
    });
    assert.equal(grab.isError, true);
    assert.deepEqual(requests, []);
  } finally {
    await client.close();
  }
});

test("write tools stay listed when ARR_READ_ONLY is not true", async () => {
  const client = await connect("false");
  try {
    const { tools } = await client.listTools();
    assert.ok(tools.some((tool) => tool.name === "radarr_manual_import"));
  } finally {
    await client.close();
  }
});
