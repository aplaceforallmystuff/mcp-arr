# CLAUDE.md - mcp-arr

MCP server for the *arr media management suite (Sonarr, Radarr, Lidarr, Prowlarr).

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js (ES modules)
- **Protocol:** Model Context Protocol (MCP)
- **Build:** TypeScript compiler (tsc)

## Architecture

```
src/
├── index.ts          # Server entry point, tool registration
├── tools/            # Tool implementations by service
│   ├── sonarr.ts     # TV show management
│   ├── radarr.ts     # Movie management
│   ├── lidarr.ts     # Music management
│   └── prowlarr.ts   # Indexer management
└── types.ts          # Shared TypeScript types
```

## Development Commands

```bash
# Build
npm run build

# Watch mode
npm run watch

# Test locally (requires env vars)
node dist/index.js
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SONARR_URL | For Sonarr | Base URL (e.g., http://localhost:8989) |
| SONARR_API_KEY | For Sonarr | API key from Sonarr settings |
| RADARR_URL | For Radarr | Base URL |
| RADARR_API_KEY | For Radarr | API key |
| LIDARR_URL | For Lidarr | Base URL |
| LIDARR_API_KEY | For Lidarr | API key |
| PROWLARR_URL | For Prowlarr | Base URL |
| PROWLARR_API_KEY | For Prowlarr | API key |

## Constraints

```yaml
rules:
  - id: no-hardcoded-urls
    description: Never hardcode service URLs or API keys
    check: All service access via environment variables

  - id: consistent-tool-naming
    description: Tool names follow pattern {service}_{action}
    examples:
      - sonarr_get_series
      - radarr_search
      - lidarr_get_albums

  - id: error-handling
    description: All API calls must handle errors gracefully
    requirements:
      - Check for missing env vars before API call
      - Return meaningful error messages
      - Don't expose raw API errors to users

  - id: trash-guides-integration
    description: TRaSH Guides tools use embedded guide data
    note: Guide data fetched from trash-guides.info at runtime
```

## Common Tasks

### Adding a New Tool

1. Add tool definition in appropriate `src/tools/{service}.ts`
2. Register in `src/index.ts` tool list
3. Update README.md "Available Tools" section
4. Update CHANGELOG.md

### Testing Changes

```bash
# Build first
npm run build

# Test with timeout (needs env vars set)
timeout 10 node dist/index.js
```

### Publishing

1. Update CHANGELOG.md
2. `npm version patch|minor|major`
3. `git push && git push --tags`
4. `npm publish`

## API Patterns

All *arr services follow similar REST patterns:
- GET `/api/v3/{resource}` - List all
- GET `/api/v3/{resource}/{id}` - Get one
- POST `/api/v3/{resource}` - Create
- PUT `/api/v3/{resource}/{id}` - Update
- DELETE `/api/v3/{resource}/{id}` - Delete
- POST `/api/v3/command` - Trigger actions (search, refresh, etc.)
