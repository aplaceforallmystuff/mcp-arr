import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";

// Every tool must declare annotations.readOnlyHint so clients can tell lookups
// apart from tools that change state. All four services are configured (with
// unreachable URLs; listing tools makes no API calls) so every tool is listed.
const WRITE_TOOLS = [
  "sonarr_search_missing",
  "sonarr_search_episode",
  "sonarr_refresh_series",
  "sonarr_add_series",
  "radarr_search_movie",
  "radarr_search_movies",
  "radarr_refresh_movie",
  "radarr_add_movie",
  "radarr_update_movie",
  "radarr_delete_queue_item",
  "lidarr_search_album",
  "lidarr_search_missing",
  "lidarr_add_artist",
  "prowlarr_test_indexers",
];

test("every tool declares an explicit readOnlyHint", async () => {
  const tools = await listTools();
  assert.ok(tools.length > 0, "expected tools to be listed");

  for (const tool of tools) {
    assert.equal(
      typeof tool.annotations?.readOnlyHint,
      "boolean",
      `${tool.name} must declare annotations.readOnlyHint`,
    );
    if (tool.annotations.readOnlyHint === false) {
      assert.equal(
        typeof tool.annotations.destructiveHint,
        "boolean",
        `${tool.name} changes state and must declare annotations.destructiveHint`,
      );
    }
  }

  const writeTools = tools
    .filter((tool) => tool.annotations.readOnlyHint === false)
    .map((tool) => tool.name)
    .sort();
  assert.deepEqual(writeTools, [...WRITE_TOOLS].sort());
});

async function listTools() {
  const env = { ...process.env, MCP_TRANSPORT: "stdio" };
  for (const service of ["SONARR", "RADARR", "LIDARR", "PROWLARR"]) {
    env[`${service}_URL`] = "http://127.0.0.1:9";
    env[`${service}_API_KEY`] = "test";
  }

  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: new URL("..", import.meta.url),
    env,
    stdio: ["pipe", "pipe", "ignore"],
  });

  try {
    const response = new Promise((resolve, reject) => {
      let buffer = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        buffer += chunk;
        let newline;
        while ((newline = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const message = JSON.parse(line);
          if (message.id === 2) resolve(message);
        }
      });
      child.once("exit", () => reject(new Error("server exited before tools/list")));
      setTimeout(() => reject(new Error("timed out waiting for tools/list")), 5000);
    });

    const send = (payload) => child.stdin.write(`${JSON.stringify(payload)}\n`);
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "mcp-arr-test", version: "0.0.0" },
      },
    });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });

    const message = await response;
    return message.result.tools;
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit").catch(() => {});
  }
}
