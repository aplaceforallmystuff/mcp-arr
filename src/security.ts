/**
 * Guards applied at the MCP dispatch boundary and in the API clients.
 *
 * The low-level MCP Server does not enforce a tool's inputSchema, so arguments
 * are checked here before any handler runs.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/** Rejected tool arguments. The message is safe to return to the client. */
export class ToolArgumentError extends Error {}

interface PropertySchema {
  type?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  items?: PropertySchema;
}

function describeProblem(value: unknown, schema: PropertySchema): string | undefined {
  switch (schema.type) {
    case "integer":
      if (typeof value !== "number" || !Number.isSafeInteger(value)) return "must be an integer";
      break;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return "must be a number";
      break;
    case "string":
      if (typeof value !== "string") return "must be a string";
      break;
    case "boolean":
      if (typeof value !== "boolean") return "must be a boolean";
      break;
    case "object":
      if (value === null || typeof value !== "object" || Array.isArray(value)) return "must be an object";
      break;
    case "array":
      if (!Array.isArray(value)) return "must be an array";
      if (schema.items) {
        for (const item of value) {
          const problem = describeProblem(item, schema.items);
          if (problem) return `items ${problem}`;
        }
      }
      break;
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) return `must be at least ${schema.minimum}`;
    if (schema.maximum !== undefined && value > schema.maximum) return `must be at most ${schema.maximum}`;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    return `must be one of: ${schema.enum.join(", ")}`;
  }
  return undefined;
}

/** Throw a ToolArgumentError unless `args` satisfies the tool's inputSchema. */
export function validateToolArgs(tool: Tool, args: Record<string, unknown>): void {
  const fail = (problem: string): never => {
    throw new ToolArgumentError(`Invalid arguments for ${tool.name}: ${problem}`);
  };

  for (const key of tool.inputSchema.required ?? []) {
    if (args[key] === undefined) fail(`${key} is required`);
  }

  const properties = (tool.inputSchema.properties ?? {}) as Record<string, PropertySchema>;
  for (const [key, schema] of Object.entries(properties)) {
    if (args[key] === undefined) continue;
    const problem = describeProblem(args[key], schema);
    if (problem) fail(`${key} ${problem}`);
  }
}

/** A positive integer ID, encoded for use in a URL path or query string. */
export function pathId(id: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ToolArgumentError("ID must be a positive integer");
  }
  return encodeURIComponent(id);
}

/**
 * Check a service base URL. The value is left out of the error because a
 * misplaced API key could be part of it.
 */
export function validateServiceUrl(envName: string, url: string): void {
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    protocol = "";
  }
  // "localhost:8989" parses with "localhost:" as its protocol, so check the scheme too.
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`${envName} must be a full http:// or https:// URL, for example http://localhost:8989`);
  }
}

/** Build a function that removes API keys from text sent back to the client. */
export function createRedactor(secrets: Array<string | undefined>): (text: string) => string {
  const known = secrets.filter((s): s is string => Boolean(s));
  return (text) => {
    let result = text.replace(/([?&]api_?key=)[^&\s"']+/gi, "$1[REDACTED]");
    for (const secret of known) {
      result = result.split(secret).join("[REDACTED]");
    }
    return result;
  };
}
