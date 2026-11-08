# Contributing to mcp-arr

If you change a tool, clients need its definition, handler, and documentation to agree. Use the steps below to build and check your change before opening a pull request.

## Getting started

1. Fork the repository and clone your fork.
2. Create a branch for your change.
3. Run `npm ci` with Node.js 20 or newer.

## Development

Run `npm run watch` while editing TypeScript, or `npm run build` for a single build. Start the compiled server with `node dist/index.js` and the environment variables documented in README.md.

Run `npm test` before submitting. These tests check HTTP transport and unique tool names using local test configuration; they do not exercise live media services. Run `npm audit --audit-level=high` for dependency changes.

## Adding or changing tools

1. Update the tool definition and handler in `src/index.ts`, following the existing `{service}_{action}` naming pattern.
2. Keep service access in `src/arr-client.ts` and TRaSH Guides access in `src/trash-client.ts`.
3. Read URLs and API keys from environment variables. Return useful errors without exposing credentials or raw API errors.
4. Update the Available Tools tables in README.md and add an entry under Unreleased in CHANGELOG.md.
5. Exercise the affected behavior and include the command and result in your pull request.

## Code style

Match the existing TypeScript style and ES module imports. Run the checks above and do not skip configured Git hooks.

## Submitting changes

Open a pull request with the problem, resulting behavior, and verification results. Use placeholder service settings in examples and keep credentials out of commits.

Report vulnerabilities through [SECURITY.md](SECURITY.md). Maintainers prepare releases with the `/publish-mcp` skill, which runs build, tests, audit, sanitization, documentation, version, and publication gates in order. Do not publish directly.
