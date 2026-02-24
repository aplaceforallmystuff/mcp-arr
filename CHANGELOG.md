# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.5.0] - 2026-02-25

### Added
- `sonarr_add_series` - Add TV series to Sonarr library
- `radarr_add_movie` - Add movies to Radarr library
- `lidarr_add_artist` - Add artists to Lidarr library
- `readarr_add_author` - Add authors to Readarr library
- Helper tools for each service: `*_get_root_folders`, `*_get_quality_profiles`
- `lidarr_get_metadata_profiles` and `readarr_get_metadata_profiles` helpers

### Changed
- Search tool descriptions now reference the add workflow (e.g., "returns tvdbId needed for sonarr_add_series")

### Fixed
- Dependency vulnerabilities in @modelcontextprotocol/sdk, ajv, hono, and qs

## [1.4.1] - 2026-01-13

### Changed
- Updated `@modelcontextprotocol/sdk` to 1.25.2
- Updated `@types/node` to 20.19.29

### Fixed
- Security vulnerability in `qs` dependency (GHSA-6rw7-vpxm-498p)

### Added
- `CLAUDE.md` for Claude Code contributors

## [1.4.0] - 2025-12-01

### Added
- **TRaSH Guides Integration** - Access community-curated quality profiles, custom formats, and naming conventions directly through Claude:
  - `trash_list_profiles` - List available TRaSH quality profiles for Radarr or Sonarr
  - `trash_get_profile` - Get detailed profile with custom formats, scores, and quality settings
  - `trash_list_custom_formats` - List custom formats with optional category filter (hdr, audio, resolution, source, streaming, anime, unwanted, release, language)
  - `trash_get_naming` - Get recommended naming conventions for Plex, Emby, Jellyfin, or standard
  - `trash_get_quality_sizes` - Get recommended min/max/preferred sizes for each quality level
  - `trash_compare_profile` - Compare your profile against TRaSH recommendations
  - `trash_compare_naming` - Compare your naming config against TRaSH recommendations

- New `trash-client.ts` module for fetching and caching TRaSH Guides data from GitHub
- 1-hour cache for TRaSH data to minimize GitHub API calls
- Custom format categorization (HDR, audio, resolution, source, streaming, anime, etc.)

### Purpose
TRaSH Guides tools enable users to reference community best practices for *arr configuration without leaving Claude. Compare your current setup against TRaSH recommendations to identify missing custom formats, quality settings differences, and naming improvements.

## [1.3.0] - 2025-11-29

### Added
- **Configuration Review Tools** - New tools to inspect and analyze *arr service configurations:
  - `{service}_get_quality_profiles` - Detailed quality profile information including allowed qualities, upgrade settings, and custom format scores
  - `{service}_get_health` - Health check warnings and issues detected by the application
  - `{service}_get_root_folders` - Storage paths, free space, and accessibility status
  - `{service}_get_download_clients` - Download client configurations and settings
  - `{service}_get_naming` - File and folder naming conventions
  - `{service}_get_tags` - Tag definitions for content organization
  - `{service}_review_setup` - Comprehensive configuration dump for AI-assisted setup analysis

  These tools are available for Sonarr, Radarr, Lidarr, and Readarr (replace `{service}` with service name).

- New API client methods for configuration retrieval:
  - `getQualityProfiles()` - Full quality profile details
  - `getQualityDefinitions()` - Size limits per quality level
  - `getDownloadClients()` - Download client configurations
  - `getNamingConfig()` - Naming conventions
  - `getMediaManagement()` - File handling settings
  - `getHealth()` - Health check warnings
  - `getTags()` - Tag definitions
  - `getIndexers()` - Per-app indexer configs
  - `getMetadataProfiles()` - Metadata profiles (Lidarr/Readarr only)

### Purpose
The new configuration review tools enable natural language conversations about *arr setup optimization. Users can ask Claude to review their configuration and suggest improvements, especially helpful for understanding complex quality profiles and media management settings.

## [1.2.0] - 2025-11-28

### Added
- Sonarr episode management tools:
  - `sonarr_get_episodes` - List episodes for a series with availability status
  - `sonarr_search_missing` - Trigger search for missing episodes
  - `sonarr_search_episode` - Search for specific episodes
- Radarr download tools:
  - `radarr_search_movie` - Trigger search for a movie
- Lidarr album management tools:
  - `lidarr_get_albums` - List albums for an artist with availability status
  - `lidarr_search_album` - Trigger search for a specific album
  - `lidarr_search_missing` - Search for all missing albums for an artist
  - `lidarr_get_calendar` - View upcoming album releases
- Readarr book management tools:
  - `readarr_get_books` - List books for an author
  - `readarr_search_book` - Trigger search for specific books
  - `readarr_search_missing` - Search for missing books
  - `readarr_get_calendar` - View upcoming book releases
- Prowlarr indexer tools:
  - `prowlarr_test_indexers` - Health check all indexers
  - `prowlarr_get_stats` - Indexer statistics

## [1.1.0] - 2025-11-28

### Fixed
- Corrected API version for Lidarr, Readarr, and Prowlarr (use `/api/v1` instead of `/api/v3`)
- Added configurable `apiVersion` property to base ArrClient class

### Added
- `server.json` for MCP registry compatibility

## [1.0.0] - 2025-11-28

### Added
- Initial release with MCP tools for *arr media management suite
- **Sonarr** (TV) tools:
  - `sonarr_get_series` - List all TV series in library
  - `sonarr_search` - Search for TV series to add
  - `sonarr_get_queue` - View download queue
  - `sonarr_get_calendar` - View upcoming episodes
- **Radarr** (Movies) tools:
  - `radarr_get_movies` - List all movies in library
  - `radarr_search` - Search for movies to add
  - `radarr_get_queue` - View download queue
  - `radarr_get_calendar` - View upcoming releases
- **Lidarr** (Music) tools:
  - `lidarr_get_artists` - List all artists in library
  - `lidarr_search` - Search for artists to add
  - `lidarr_get_queue` - View download queue
- **Readarr** (Books) tools:
  - `readarr_get_authors` - List all authors in library
  - `readarr_search` - Search for authors to add
  - `readarr_get_queue` - View download queue
- **Prowlarr** (Indexers) tools:
  - `prowlarr_get_indexers` - List configured indexers
  - `prowlarr_search` - Search across all indexers
- **Cross-service** tools:
  - `arr_status` - Check health of all configured services
  - `arr_search_all` - Search across all media types
