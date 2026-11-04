import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";

const services = ["sonarr", "radarr", "lidarr", "prowlarr"];
const configurations = [[], ...services.map((service) => [service]), services];

for (const configured of configurations) {
  const label = configured.join(", ") || "TRaSH-only";
  test(`tools/list advertises unique names (${label})`, async (t) => {
    const port = String(34000 + Math.floor(Math.random() * 1000));
    const env = {
      ...process.env,
      MCP_TRANSPORT: "http",
      MCP_PATH: "/mcp",
      HOST: "127.0.0.1",
      PORT: port,
    };
    // Never inherit real service configuration or contact a live *arr instance.
    // Listing tools only requires that a URL and API key are configured.
    for (const service of services) {
      const prefix = service.toUpperCase();
      env[`${prefix}_URL`] = configured.includes(service) ? "http://127.0.0.1:1" : "";
      env[`${prefix}_API_KEY`] = configured.includes(service) ? "test-key" : "";
    }

    const child = spawn(process.execPath, ["dist/index.js"], {
      cwd: new URL("..", import.meta.url),
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const exited = once(child, "exit");
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    try {
      await waitForHealth(port, configured);
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        }),
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(response.status, 200);
      const body = await response.text();
      const data = body.split(/\r?\n/).find((line) => line.startsWith("data: "));
      assert.ok(data, `expected an SSE response, got: ${body}`);
      const message = JSON.parse(data.slice(6));
      assert.equal(message.error, undefined);
      const names = message.result.tools.map((tool) => tool.name);
      assert.ok(names.length > 0);
      assert.ok(names.every((name) => typeof name === "string" && name.trim().length > 0));
      const duplicates = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
      t.diagnostic(`${names.length} tools, ${new Set(names).size} unique names`);
      assert.deepEqual(duplicates, [], "duplicate tool names advertised");

      // Removing duplicate registrations must not remove the tools themselves.
      for (const service of ["sonarr", "radarr", "lidarr"]) {
        for (const action of ["get_quality_profiles", "get_root_folders"]) {
          const name = `${service}_${action}`;
          assert.equal(
            names.filter((toolName) => toolName === name).length,
            configured.includes(service) ? 1 : 0,
            name,
          );
        }
      }
      assert.equal(
        names.filter((name) => name === "lidarr_get_metadata_profiles").length,
        configured.includes("lidarr") ? 1 : 0,
        "lidarr_get_metadata_profiles",
      );
    } finally {
      child.kill("SIGTERM");
      await exited;
    }

    assert.doesNotMatch(stderr, /Fatal error/);
  });
}

async function waitForHealth(port, configured) {
  const deadline = Date.now() + 5000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        const health = await response.json();
        assert.deepEqual(health.configuredServices, configured);
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`HTTP server did not become healthy: ${lastError}`);
}
