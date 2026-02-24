#!/usr/bin/env node
/**
 * MCP Server for *arr Media Management Suite
 *
 * Provides tools for managing Sonarr (TV), Radarr (Movies), Lidarr (Music),
 * Readarr (Books), and Prowlarr (Indexers) through Claude Code.
 *
 * Environment variables:
 * - SONARR_URL, SONARR_API_KEY
 * - RADARR_URL, RADARR_API_KEY
 * - LIDARR_URL, LIDARR_API_KEY
 * - READARR_URL, READARR_API_KEY
 * - PROWLARR_URL, PROWLARR_API_KEY
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  SonarrClient,
  RadarrClient,
  LidarrClient,
  ReadarrClient,
  ProwlarrClient,
  ArrService,
} from "./arr-client.js";
import { trashClient, TrashService } from "./trash-client.js";

// Configuration from environment
interface ServiceConfig {
  name: ArrService;
  displayName: string;
  url?: string;
  apiKey?: string;
}

const services: ServiceConfig[] = [
  { name: 'sonarr', displayName: 'Sonarr (TV)', url: process.env.SONARR_URL, apiKey: process.env.SONARR_API_KEY },
  { name: 'radarr', displayName: 'Radarr (Movies)', url: process.env.RADARR_URL, apiKey: process.env.RADARR_API_KEY },
  { name: 'lidarr', displayName: 'Lidarr (Music)', url: process.env.LIDARR_URL, apiKey: process.env.LIDARR_API_KEY },
  { name: 'readarr', displayName: 'Readarr (Books)', url: process.env.READARR_URL, apiKey: process.env.READARR_API_KEY },
  { name: 'prowlarr', displayName: 'Prowlarr (Indexers)', url: process.env.PROWLARR_URL, apiKey: process.env.PROWLARR_API_KEY },
];

// Check which services are configured
const configuredServices = services.filter(s => s.url && s.apiKey);

if (configuredServices.length === 0) {
  console.error("Error: No *arr services configured. Set at least one pair of URL and API_KEY environment variables.");
  console.error("Example: SONARR_URL and SONARR_API_KEY");
  process.exit(1);
}

// Initialize clients for configured services
const clients: {
  sonarr?: SonarrClient;
  radarr?: RadarrClient;
  lidarr?: LidarrClient;
  readarr?: ReadarrClient;
  prowlarr?: ProwlarrClient;
} = {};

for (const service of configuredServices) {
  const config = { url: service.url!, apiKey: service.apiKey! };
  switch (service.name) {
    case 'sonarr':
      clients.sonarr = new SonarrClient(config);
      break;
    case 'radarr':
      clients.radarr = new RadarrClient(config);
      break;
    case 'lidarr':
      clients.lidarr = new LidarrClient(config);
      break;
    case 'readarr':
      clients.readarr = new ReadarrClient(config);
      break;
    case 'prowlarr':
      clients.prowlarr = new ProwlarrClient(config);
      break;
  }
}

// Build tools based on configured services
const TOOLS: Tool[] = [
  // General tool available for all
  {
    name: "arr_status",
    description: `Get status of all configured *arr services. Currently configured: ${configuredServices.map(s => s.displayName).join(', ')}`,
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Configuration review tools for each service
// These are added dynamically based on configured services

// Helper function to create config tools for a service
function addConfigTools(serviceName: string, displayName: string) {
  TOOLS.push(
    {
      name: `${serviceName}_get_quality_profiles`,
      description: `Get detailed quality profiles from ${displayName}. Shows allowed qualities, upgrade settings, and custom format scores.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_get_health`,
      description: `Get health check warnings and issues from ${displayName}. Shows any problems detected by the application.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_get_root_folders`,
      description: `Get root folders and storage info from ${displayName}. Shows paths, free space, and unmapped folders.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_get_download_clients`,
      description: `Get download client configurations from ${displayName}. Shows configured clients and their settings.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_get_naming`,
      description: `Get file naming configuration from ${displayName}. Shows naming patterns for files and folders.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_get_tags`,
      description: `Get all tags defined in ${displayName}. Tags can be used to organize and filter content.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: `${serviceName}_review_setup`,
      description: `Get comprehensive configuration review for ${displayName}. Returns all settings for analysis: quality profiles, download clients, naming, storage, indexers, health warnings, and more. Use this to analyze the setup and suggest improvements.`,
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Add config tools for each configured service (except Prowlarr which has different config)
if (clients.sonarr) addConfigTools('sonarr', 'Sonarr (TV)');
if (clients.radarr) addConfigTools('radarr', 'Radarr (Movies)');
if (clients.lidarr) addConfigTools('lidarr', 'Lidarr (Music)');
if (clients.readarr) addConfigTools('readarr', 'Readarr (Books)');

// Sonarr tools
if (clients.sonarr) {
  TOOLS.push(
    {
      name: "sonarr_get_series",
      description: "Get all TV series in Sonarr library",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "sonarr_search",
      description: "Search for TV series by name. Returns results with tvdbId needed for sonarr_add_series.",
      inputSchema: {
        type: "object" as const,
        properties: {
          term: {
            type: "string",
            description: "Search term (show name)",
          },
        },
        required: ["term"],
      },
    },
    {
      name: "sonarr_get_queue",
      description: "Get Sonarr download queue",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "sonarr_get_calendar",
      description: "Get upcoming TV episodes from Sonarr",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 7)",
          },
        },
        required: [],
      },
    },
    {
      name: "sonarr_get_episodes",
      description: "Get episodes for a TV series. Shows which episodes are available and which are missing.",
      inputSchema: {
        type: "object" as const,
        properties: {
          seriesId: {
            type: "number",
            description: "Series ID to get episodes for",
          },
          seasonNumber: {
            type: "number",
            description: "Optional: filter to a specific season",
          },
        },
        required: ["seriesId"],
      },
    },
    {
      name: "sonarr_search_missing",
      description: "Trigger a search for all missing episodes in a series",
      inputSchema: {
        type: "object" as const,
        properties: {
          seriesId: {
            type: "number",
            description: "Series ID to search for missing episodes",
          },
        },
        required: ["seriesId"],
      },
    },
    {
      name: "sonarr_search_episode",
      description: "Trigger a search for specific episode(s)",
      inputSchema: {
        type: "object" as const,
        properties: {
          episodeIds: {
            type: "array",
            items: { type: "number" },
            description: "Episode ID(s) to search for",
          },
        },
        required: ["episodeIds"],
      },
    },
    {
      name: "sonarr_add_series",
      description: "Add a TV series to Sonarr. Use sonarr_search first to find the tvdbId, and sonarr_get_root_folders / sonarr_get_quality_profiles to get valid values for rootFolderPath and qualityProfileId.",
      inputSchema: {
        type: "object" as const,
        properties: {
          tvdbId: {
            type: "number",
            description: "TVDB ID from sonarr_search results",
          },
          title: {
            type: "string",
            description: "Series title",
          },
          qualityProfileId: {
            type: "number",
            description: "Quality profile ID from sonarr_get_quality_profiles",
          },
          rootFolderPath: {
            type: "string",
            description: "Root folder path from sonarr_get_root_folders",
          },
          monitored: {
            type: "boolean",
            description: "Whether to monitor the series (default: true)",
          },
          seasonFolder: {
            type: "boolean",
            description: "Whether to use season folders (default: true)",
          },
        },
        required: ["tvdbId", "title", "qualityProfileId", "rootFolderPath"],
      },
    },
    {
      name: "sonarr_get_root_folders",
      description: "Get available root folders for Sonarr. Use this to find valid rootFolderPath values when adding a series.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "sonarr_get_quality_profiles",
      description: "Get available quality profiles for Sonarr. Use this to find valid qualityProfileId values when adding a series.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Radarr tools
if (clients.radarr) {
  TOOLS.push(
    {
      name: "radarr_get_movies",
      description: "Get all movies in Radarr library",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "radarr_search",
      description: "Search for movies by name. Returns results with tmdbId needed for radarr_add_movie.",
      inputSchema: {
        type: "object" as const,
        properties: {
          term: {
            type: "string",
            description: "Search term (movie name)",
          },
        },
        required: ["term"],
      },
    },
    {
      name: "radarr_get_queue",
      description: "Get Radarr download queue",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "radarr_get_calendar",
      description: "Get upcoming movie releases from Radarr",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 30)",
          },
        },
        required: [],
      },
    },
    {
      name: "radarr_search_movie",
      description: "Trigger a search to download a movie that's already in your library",
      inputSchema: {
        type: "object" as const,
        properties: {
          movieId: {
            type: "number",
            description: "Movie ID to search for",
          },
        },
        required: ["movieId"],
      },
    },
    {
      name: "radarr_add_movie",
      description: "Add a movie to Radarr. Use radarr_search first to find the tmdbId, and radarr_get_root_folders / radarr_get_quality_profiles to get valid values.",
      inputSchema: {
        type: "object" as const,
        properties: {
          tmdbId: {
            type: "number",
            description: "TMDB ID from radarr_search results",
          },
          title: {
            type: "string",
            description: "Movie title",
          },
          qualityProfileId: {
            type: "number",
            description: "Quality profile ID from radarr_get_quality_profiles",
          },
          rootFolderPath: {
            type: "string",
            description: "Root folder path from radarr_get_root_folders",
          },
          monitored: {
            type: "boolean",
            description: "Whether to monitor the movie (default: true)",
          },
          minimumAvailability: {
            type: "string",
            enum: ["announced", "inCinemas", "released", "tba"],
            description: "When to consider the movie available (default: announced)",
          },
        },
        required: ["tmdbId", "title", "qualityProfileId", "rootFolderPath"],
      },
    },
    {
      name: "radarr_get_root_folders",
      description: "Get available root folders for Radarr. Use this to find valid rootFolderPath values when adding a movie.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "radarr_get_quality_profiles",
      description: "Get available quality profiles for Radarr. Use this to find valid qualityProfileId values when adding a movie.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Lidarr tools
if (clients.lidarr) {
  TOOLS.push(
    {
      name: "lidarr_get_artists",
      description: "Get all artists in Lidarr library",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "lidarr_search",
      description: "Search for artists by name. Returns results with foreignArtistId needed for lidarr_add_artist.",
      inputSchema: {
        type: "object" as const,
        properties: {
          term: {
            type: "string",
            description: "Search term (artist name)",
          },
        },
        required: ["term"],
      },
    },
    {
      name: "lidarr_get_queue",
      description: "Get Lidarr download queue",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "lidarr_get_albums",
      description: "Get albums for an artist in Lidarr. Shows which albums are available and which are missing.",
      inputSchema: {
        type: "object" as const,
        properties: {
          artistId: {
            type: "number",
            description: "Artist ID to get albums for",
          },
        },
        required: ["artistId"],
      },
    },
    {
      name: "lidarr_search_album",
      description: "Trigger a search for a specific album to download",
      inputSchema: {
        type: "object" as const,
        properties: {
          albumId: {
            type: "number",
            description: "Album ID to search for",
          },
        },
        required: ["albumId"],
      },
    },
    {
      name: "lidarr_search_missing",
      description: "Trigger a search for all missing albums for an artist",
      inputSchema: {
        type: "object" as const,
        properties: {
          artistId: {
            type: "number",
            description: "Artist ID to search missing albums for",
          },
        },
        required: ["artistId"],
      },
    },
    {
      name: "lidarr_get_calendar",
      description: "Get upcoming album releases from Lidarr",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 30)",
          },
        },
        required: [],
      },
    },
    {
      name: "lidarr_add_artist",
      description: "Add an artist to Lidarr. Use lidarr_search first to find the foreignArtistId, and lidarr_get_root_folders / lidarr_get_quality_profiles / lidarr_get_metadata_profiles to get valid values.",
      inputSchema: {
        type: "object" as const,
        properties: {
          foreignArtistId: {
            type: "string",
            description: "Foreign artist ID (MusicBrainz ID) from lidarr_search results",
          },
          artistName: {
            type: "string",
            description: "Artist name",
          },
          qualityProfileId: {
            type: "number",
            description: "Quality profile ID from lidarr_get_quality_profiles",
          },
          metadataProfileId: {
            type: "number",
            description: "Metadata profile ID from lidarr_get_metadata_profiles",
          },
          rootFolderPath: {
            type: "string",
            description: "Root folder path from lidarr_get_root_folders",
          },
          monitored: {
            type: "boolean",
            description: "Whether to monitor the artist (default: true)",
          },
        },
        required: ["foreignArtistId", "artistName", "qualityProfileId", "metadataProfileId", "rootFolderPath"],
      },
    },
    {
      name: "lidarr_get_root_folders",
      description: "Get available root folders for Lidarr. Use this to find valid rootFolderPath values when adding an artist.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "lidarr_get_quality_profiles",
      description: "Get available quality profiles for Lidarr. Use this to find valid qualityProfileId values when adding an artist.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "lidarr_get_metadata_profiles",
      description: "Get available metadata profiles for Lidarr. Use this to find valid metadataProfileId values when adding an artist.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Readarr tools
if (clients.readarr) {
  TOOLS.push(
    {
      name: "readarr_get_authors",
      description: "Get all authors in Readarr library",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "readarr_search",
      description: "Search for authors by name. Returns results with foreignAuthorId needed for readarr_add_author.",
      inputSchema: {
        type: "object" as const,
        properties: {
          term: {
            type: "string",
            description: "Search term (author name)",
          },
        },
        required: ["term"],
      },
    },
    {
      name: "readarr_get_queue",
      description: "Get Readarr download queue",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "readarr_get_books",
      description: "Get books for an author in Readarr. Shows which books are available and which are missing.",
      inputSchema: {
        type: "object" as const,
        properties: {
          authorId: {
            type: "number",
            description: "Author ID to get books for",
          },
        },
        required: ["authorId"],
      },
    },
    {
      name: "readarr_search_book",
      description: "Trigger a search for a specific book to download",
      inputSchema: {
        type: "object" as const,
        properties: {
          bookIds: {
            type: "array",
            items: { type: "number" },
            description: "Book ID(s) to search for",
          },
        },
        required: ["bookIds"],
      },
    },
    {
      name: "readarr_search_missing",
      description: "Trigger a search for all missing books for an author",
      inputSchema: {
        type: "object" as const,
        properties: {
          authorId: {
            type: "number",
            description: "Author ID to search missing books for",
          },
        },
        required: ["authorId"],
      },
    },
    {
      name: "readarr_get_calendar",
      description: "Get upcoming book releases from Readarr",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 30)",
          },
        },
        required: [],
      },
    },
    {
      name: "readarr_add_author",
      description: "Add an author to Readarr. Use readarr_search first to find the foreignAuthorId, and readarr_get_root_folders / readarr_get_quality_profiles / readarr_get_metadata_profiles to get valid values.",
      inputSchema: {
        type: "object" as const,
        properties: {
          foreignAuthorId: {
            type: "string",
            description: "Foreign author ID from readarr_search results",
          },
          authorName: {
            type: "string",
            description: "Author name",
          },
          qualityProfileId: {
            type: "number",
            description: "Quality profile ID from readarr_get_quality_profiles",
          },
          metadataProfileId: {
            type: "number",
            description: "Metadata profile ID from readarr_get_metadata_profiles",
          },
          rootFolderPath: {
            type: "string",
            description: "Root folder path from readarr_get_root_folders",
          },
          monitored: {
            type: "boolean",
            description: "Whether to monitor the author (default: true)",
          },
        },
        required: ["foreignAuthorId", "authorName", "qualityProfileId", "metadataProfileId", "rootFolderPath"],
      },
    },
    {
      name: "readarr_get_root_folders",
      description: "Get available root folders for Readarr. Use this to find valid rootFolderPath values when adding an author.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "readarr_get_quality_profiles",
      description: "Get available quality profiles for Readarr. Use this to find valid qualityProfileId values when adding an author.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "readarr_get_metadata_profiles",
      description: "Get available metadata profiles for Readarr. Use this to find valid metadataProfileId values when adding an author.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Prowlarr tools
if (clients.prowlarr) {
  TOOLS.push(
    {
      name: "prowlarr_get_indexers",
      description: "Get all configured indexers in Prowlarr",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "prowlarr_search",
      description: "Search across all Prowlarr indexers",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "prowlarr_test_indexers",
      description: "Test all indexers and return their health status",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "prowlarr_get_stats",
      description: "Get indexer statistics (queries, grabs, failures)",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    }
  );
}

// Cross-service search tool
TOOLS.push({
  name: "arr_search_all",
  description: "Search across all configured *arr services for any media",
  inputSchema: {
    type: "object" as const,
    properties: {
      term: {
        type: "string",
        description: "Search term",
      },
    },
    required: ["term"],
  },
});

// TRaSH Guides tools (always available - no *arr config required)
TOOLS.push(
  {
    name: "trash_list_profiles",
    description: "List available TRaSH Guides quality profiles for Radarr or Sonarr. Shows recommended profiles for different use cases (1080p, 4K, Remux, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service to get profiles for",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "trash_get_profile",
    description: "Get a specific TRaSH Guides quality profile with all custom format scores, quality settings, and implementation details",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        profile: {
          type: "string",
          description: "Profile name (e.g., 'remux-web-1080p', 'uhd-bluray-web', 'hd-bluray-web')",
        },
      },
      required: ["service", "profile"],
    },
  },
  {
    name: "trash_list_custom_formats",
    description: "List available TRaSH Guides custom formats. Can filter by category: hdr, audio, resolution, source, streaming, anime, unwanted, release, language",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        category: {
          type: "string",
          description: "Optional filter by category",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "trash_get_naming",
    description: "Get TRaSH Guides recommended naming conventions for your media server (Plex, Emby, Jellyfin, or standard)",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        mediaServer: {
          type: "string",
          enum: ["plex", "emby", "jellyfin", "standard"],
          description: "Which media server you use",
        },
      },
      required: ["service", "mediaServer"],
    },
  },
  {
    name: "trash_get_quality_sizes",
    description: "Get TRaSH Guides recommended min/max/preferred sizes for each quality level",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        type: {
          type: "string",
          description: "Content type: 'movie', 'anime' for Radarr; 'series', 'anime' for Sonarr",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "trash_compare_profile",
    description: "Compare your quality profile against TRaSH Guides recommendations. Shows missing custom formats, scoring differences, and quality settings. Requires the corresponding *arr service to be configured.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        profileId: {
          type: "number",
          description: "Your quality profile ID to compare",
        },
        trashProfile: {
          type: "string",
          description: "TRaSH profile name to compare against",
        },
      },
      required: ["service", "profileId", "trashProfile"],
    },
  },
  {
    name: "trash_compare_naming",
    description: "Compare your naming configuration against TRaSH Guides recommendations. Requires the corresponding *arr service to be configured.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          enum: ["radarr", "sonarr"],
          description: "Which service",
        },
        mediaServer: {
          type: "string",
          enum: ["plex", "emby", "jellyfin", "standard"],
          description: "Which media server you use",
        },
      },
      required: ["service", "mediaServer"],
    },
  }
);

// Create server instance
const server = new Server(
  {
    name: "mcp-arr",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "arr_status": {
        const statuses: Record<string, unknown> = {};
        for (const service of configuredServices) {
          try {
            const client = clients[service.name];
            if (client) {
              const status = await client.getStatus();
              statuses[service.name] = {
                configured: true,
                connected: true,
                version: status.version,
                appName: status.appName,
              };
            }
          } catch (error) {
            statuses[service.name] = {
              configured: true,
              connected: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }
        // Add unconfigured services
        for (const service of services) {
          if (!statuses[service.name]) {
            statuses[service.name] = { configured: false };
          }
        }
        return {
          content: [{ type: "text", text: JSON.stringify(statuses, null, 2) }],
        };
      }

      // Dynamic config tool handlers
      // Quality Profiles
      case "sonarr_get_quality_profiles":
      case "radarr_get_quality_profiles":
      case "lidarr_get_quality_profiles":
      case "readarr_get_quality_profiles": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const profiles = await client.getQualityProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: profiles.length,
              profiles: profiles.map(p => ({
                id: p.id,
                name: p.name,
                upgradeAllowed: p.upgradeAllowed,
                cutoff: p.cutoff,
                allowedQualities: p.items
                  .filter(i => i.allowed)
                  .map(i => i.quality?.name || i.name || (i.items?.map(q => q.quality.name).join(', ')))
                  .filter(Boolean),
                customFormats: p.formatItems?.filter(f => f.score !== 0).map(f => ({
                  name: f.name,
                  score: f.score,
                })) || [],
                minFormatScore: p.minFormatScore,
                cutoffFormatScore: p.cutoffFormatScore,
              })),
            }, null, 2),
          }],
        };
      }

      // Health checks
      case "sonarr_get_health":
      case "radarr_get_health":
      case "lidarr_get_health":
      case "readarr_get_health": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const health = await client.getHealth();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              issueCount: health.length,
              issues: health.map(h => ({
                source: h.source,
                type: h.type,
                message: h.message,
                wikiUrl: h.wikiUrl,
              })),
              status: health.length === 0 ? 'healthy' : 'issues detected',
            }, null, 2),
          }],
        };
      }

      // Root folders
      case "sonarr_get_root_folders":
      case "radarr_get_root_folders":
      case "lidarr_get_root_folders":
      case "readarr_get_root_folders": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const folders = await client.getRootFoldersDetailed();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: folders.length,
              folders: folders.map(f => ({
                id: f.id,
                path: f.path,
                accessible: f.accessible,
                freeSpace: formatBytes(f.freeSpace),
                freeSpaceBytes: f.freeSpace,
                unmappedFolders: f.unmappedFolders?.length || 0,
              })),
            }, null, 2),
          }],
        };
      }

      // Download clients
      case "sonarr_get_download_clients":
      case "radarr_get_download_clients":
      case "lidarr_get_download_clients":
      case "readarr_get_download_clients": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const downloadClients = await client.getDownloadClients();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: downloadClients.length,
              clients: downloadClients.map(c => ({
                id: c.id,
                name: c.name,
                implementation: c.implementationName,
                protocol: c.protocol,
                enabled: c.enable,
                priority: c.priority,
                removeCompletedDownloads: c.removeCompletedDownloads,
                removeFailedDownloads: c.removeFailedDownloads,
                tags: c.tags,
              })),
            }, null, 2),
          }],
        };
      }

      // Naming config
      case "sonarr_get_naming":
      case "radarr_get_naming":
      case "lidarr_get_naming":
      case "readarr_get_naming": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const naming = await client.getNamingConfig();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(naming, null, 2),
          }],
        };
      }

      // Tags
      case "sonarr_get_tags":
      case "radarr_get_tags":
      case "lidarr_get_tags":
      case "readarr_get_tags": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);
        const tags = await client.getTags();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: tags.length,
              tags: tags.map(t => ({ id: t.id, label: t.label })),
            }, null, 2),
          }],
        };
      }

      // Comprehensive setup review
      case "sonarr_review_setup":
      case "radarr_review_setup":
      case "lidarr_review_setup":
      case "readarr_review_setup": {
        const serviceName = name.split('_')[0] as keyof typeof clients;
        const client = clients[serviceName];
        if (!client) throw new Error(`${serviceName} not configured`);

        // Gather all configuration data
        const [status, health, qualityProfiles, qualityDefinitions, downloadClients, naming, mediaManagement, rootFolders, tags, indexers] = await Promise.all([
          client.getStatus(),
          client.getHealth(),
          client.getQualityProfiles(),
          client.getQualityDefinitions(),
          client.getDownloadClients(),
          client.getNamingConfig(),
          client.getMediaManagement(),
          client.getRootFoldersDetailed(),
          client.getTags(),
          client.getIndexers(),
        ]);

        // For Lidarr/Readarr, also get metadata profiles
        let metadataProfiles = null;
        if (serviceName === 'lidarr' && clients.lidarr) {
          metadataProfiles = await clients.lidarr.getMetadataProfiles();
        } else if (serviceName === 'readarr' && clients.readarr) {
          metadataProfiles = await clients.readarr.getMetadataProfiles();
        }

        const review = {
          service: serviceName,
          version: status.version,
          appName: status.appName,
          platform: {
            os: status.osName,
            isDocker: status.isDocker,
          },
          health: {
            issueCount: health.length,
            issues: health,
          },
          storage: {
            rootFolders: rootFolders.map(f => ({
              path: f.path,
              accessible: f.accessible,
              freeSpace: formatBytes(f.freeSpace),
              freeSpaceBytes: f.freeSpace,
              unmappedFolderCount: f.unmappedFolders?.length || 0,
            })),
          },
          qualityProfiles: qualityProfiles.map(p => ({
            id: p.id,
            name: p.name,
            upgradeAllowed: p.upgradeAllowed,
            cutoff: p.cutoff,
            allowedQualities: p.items
              .filter(i => i.allowed)
              .map(i => i.quality?.name || i.name || (i.items?.map(q => q.quality.name).join(', ')))
              .filter(Boolean),
            customFormatsWithScores: p.formatItems?.filter(f => f.score !== 0).length || 0,
            minFormatScore: p.minFormatScore,
          })),
          qualityDefinitions: qualityDefinitions.map(d => ({
            quality: d.quality.name,
            minSize: d.minSize + ' MB/min',
            maxSize: d.maxSize === 0 ? 'unlimited' : d.maxSize + ' MB/min',
            preferredSize: d.preferredSize + ' MB/min',
          })),
          downloadClients: downloadClients.map(c => ({
            name: c.name,
            type: c.implementationName,
            protocol: c.protocol,
            enabled: c.enable,
            priority: c.priority,
          })),
          indexers: indexers.map(i => ({
            name: i.name,
            protocol: i.protocol,
            enableRss: i.enableRss,
            enableAutomaticSearch: i.enableAutomaticSearch,
            enableInteractiveSearch: i.enableInteractiveSearch,
            priority: i.priority,
          })),
          naming: naming,
          mediaManagement: {
            recycleBin: mediaManagement.recycleBin || 'not set',
            recycleBinCleanupDays: mediaManagement.recycleBinCleanupDays,
            downloadPropersAndRepacks: mediaManagement.downloadPropersAndRepacks,
            deleteEmptyFolders: mediaManagement.deleteEmptyFolders,
            copyUsingHardlinks: mediaManagement.copyUsingHardlinks,
            importExtraFiles: mediaManagement.importExtraFiles,
            extraFileExtensions: mediaManagement.extraFileExtensions,
          },
          tags: tags.map(t => t.label),
          ...(metadataProfiles && { metadataProfiles }),
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(review, null, 2),
          }],
        };
      }

      // Sonarr handlers
      case "sonarr_get_series": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const series = await clients.sonarr.getSeries();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: series.length,
              series: series.map(s => ({
                id: s.id,
                title: s.title,
                year: s.year,
                status: s.status,
                network: s.network,
                seasons: s.statistics?.seasonCount,
                episodes: s.statistics?.episodeFileCount + '/' + s.statistics?.totalEpisodeCount,
                sizeOnDisk: formatBytes(s.statistics?.sizeOnDisk || 0),
                monitored: s.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "sonarr_search": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const term = (args as { term: string }).term;
        const results = await clients.sonarr.searchSeries(term);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: results.length,
              results: results.slice(0, 10).map(r => ({
                title: r.title,
                year: r.year,
                tvdbId: r.tvdbId,
                overview: r.overview?.substring(0, 200) + (r.overview && r.overview.length > 200 ? '...' : ''),
              })),
            }, null, 2),
          }],
        };
      }

      case "sonarr_get_queue": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const queue = await clients.sonarr.getQueue();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalRecords: queue.totalRecords,
              items: queue.records.map(q => ({
                title: q.title,
                status: q.status,
                progress: ((1 - q.sizeleft / q.size) * 100).toFixed(1) + '%',
                timeLeft: q.timeleft,
                downloadClient: q.downloadClient,
              })),
            }, null, 2),
          }],
        };
      }

      case "sonarr_get_calendar": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const days = (args as { days?: number })?.days || 7;
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const calendar = await clients.sonarr.getCalendar(start, end);
        return {
          content: [{ type: "text", text: JSON.stringify(calendar, null, 2) }],
        };
      }

      case "sonarr_get_episodes": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const { seriesId, seasonNumber } = args as { seriesId: number; seasonNumber?: number };
        const episodes = await clients.sonarr.getEpisodes(seriesId, seasonNumber);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: episodes.length,
              episodes: episodes.map(e => ({
                id: e.id,
                seasonNumber: e.seasonNumber,
                episodeNumber: e.episodeNumber,
                title: e.title,
                airDate: e.airDate,
                hasFile: e.hasFile,
                monitored: e.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "sonarr_search_missing": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const seriesId = (args as { seriesId: number }).seriesId;
        const result = await clients.sonarr.searchMissing(seriesId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for missing episodes`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "sonarr_search_episode": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const episodeIds = (args as { episodeIds: number[] }).episodeIds;
        const result = await clients.sonarr.searchEpisode(episodeIds);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for ${episodeIds.length} episode(s)`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "sonarr_add_series": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const { tvdbId, title, qualityProfileId, rootFolderPath, monitored, seasonFolder } = args as {
          tvdbId: number; title: string; qualityProfileId: number; rootFolderPath: string;
          monitored?: boolean; seasonFolder?: boolean;
        };
        const added = await clients.sonarr.addSeries({
          tvdbId, title, qualityProfileId, rootFolderPath, monitored, seasonFolder,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Added "${added.title}" (${added.year}) to Sonarr`,
              id: added.id,
              path: added.path,
              monitored: added.monitored,
            }, null, 2),
          }],
        };
      }

      case "sonarr_get_root_folders": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const folders = await clients.sonarr.getRootFolders();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(folders, null, 2),
          }],
        };
      }

      case "sonarr_get_quality_profiles": {
        if (!clients.sonarr) throw new Error("Sonarr not configured");
        const profiles = await clients.sonarr.getQualityProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      // Radarr handlers
      case "radarr_get_movies": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const movies = await clients.radarr.getMovies();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: movies.length,
              movies: movies.map(m => ({
                id: m.id,
                title: m.title,
                year: m.year,
                status: m.status,
                hasFile: m.hasFile,
                sizeOnDisk: formatBytes(m.sizeOnDisk),
                monitored: m.monitored,
                studio: m.studio,
              })),
            }, null, 2),
          }],
        };
      }

      case "radarr_search": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const term = (args as { term: string }).term;
        const results = await clients.radarr.searchMovies(term);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: results.length,
              results: results.slice(0, 10).map(r => ({
                title: r.title,
                year: r.year,
                tmdbId: r.tmdbId,
                imdbId: r.imdbId,
                overview: r.overview?.substring(0, 200) + (r.overview && r.overview.length > 200 ? '...' : ''),
              })),
            }, null, 2),
          }],
        };
      }

      case "radarr_get_queue": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const queue = await clients.radarr.getQueue();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalRecords: queue.totalRecords,
              items: queue.records.map(q => ({
                title: q.title,
                status: q.status,
                progress: ((1 - q.sizeleft / q.size) * 100).toFixed(1) + '%',
                timeLeft: q.timeleft,
                downloadClient: q.downloadClient,
              })),
            }, null, 2),
          }],
        };
      }

      case "radarr_get_calendar": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const days = (args as { days?: number })?.days || 30;
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const calendar = await clients.radarr.getCalendar(start, end);
        return {
          content: [{ type: "text", text: JSON.stringify(calendar, null, 2) }],
        };
      }

      case "radarr_search_movie": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const movieId = (args as { movieId: number }).movieId;
        const result = await clients.radarr.searchMovie(movieId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for movie`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "radarr_add_movie": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const { tmdbId, title, qualityProfileId, rootFolderPath, monitored, minimumAvailability } = args as {
          tmdbId: number; title: string; qualityProfileId: number; rootFolderPath: string;
          monitored?: boolean; minimumAvailability?: string;
        };
        const added = await clients.radarr.addMovie({
          tmdbId, title, qualityProfileId, rootFolderPath, monitored, minimumAvailability,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Added "${added.title}" (${added.year}) to Radarr`,
              id: added.id,
              path: added.path,
              monitored: added.monitored,
            }, null, 2),
          }],
        };
      }

      case "radarr_get_root_folders": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const folders = await clients.radarr.getRootFolders();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(folders, null, 2),
          }],
        };
      }

      case "radarr_get_quality_profiles": {
        if (!clients.radarr) throw new Error("Radarr not configured");
        const profiles = await clients.radarr.getQualityProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      // Lidarr handlers
      case "lidarr_get_artists": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const artists = await clients.lidarr.getArtists();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: artists.length,
              artists: artists.map(a => ({
                id: a.id,
                artistName: a.artistName,
                status: a.status,
                albums: a.statistics?.albumCount,
                tracks: a.statistics?.trackFileCount + '/' + a.statistics?.totalTrackCount,
                sizeOnDisk: formatBytes(a.statistics?.sizeOnDisk || 0),
                monitored: a.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "lidarr_search": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const term = (args as { term: string }).term;
        const results = await clients.lidarr.searchArtists(term);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: results.length,
              results: results.slice(0, 10).map(r => ({
                title: r.title,
                foreignArtistId: r.foreignArtistId,
                overview: r.overview?.substring(0, 200) + (r.overview && r.overview.length > 200 ? '...' : ''),
              })),
            }, null, 2),
          }],
        };
      }

      case "lidarr_get_queue": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const queue = await clients.lidarr.getQueue();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalRecords: queue.totalRecords,
              items: queue.records.map(q => ({
                title: q.title,
                status: q.status,
                progress: ((1 - q.sizeleft / q.size) * 100).toFixed(1) + '%',
                timeLeft: q.timeleft,
                downloadClient: q.downloadClient,
              })),
            }, null, 2),
          }],
        };
      }

      case "lidarr_get_albums": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const artistId = (args as { artistId: number }).artistId;
        const albums = await clients.lidarr.getAlbums(artistId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: albums.length,
              albums: albums.map(a => ({
                id: a.id,
                title: a.title,
                releaseDate: a.releaseDate,
                albumType: a.albumType,
                monitored: a.monitored,
                tracks: a.statistics ? `${a.statistics.trackFileCount}/${a.statistics.totalTrackCount}` : 'unknown',
                sizeOnDisk: formatBytes(a.statistics?.sizeOnDisk || 0),
                percentComplete: a.statistics?.percentOfTracks || 0,
                grabbed: a.grabbed,
              })),
            }, null, 2),
          }],
        };
      }

      case "lidarr_search_album": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const albumId = (args as { albumId: number }).albumId;
        const result = await clients.lidarr.searchAlbum(albumId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for album`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "lidarr_search_missing": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const artistId = (args as { artistId: number }).artistId;
        const result = await clients.lidarr.searchMissingAlbums(artistId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for missing albums`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "lidarr_get_calendar": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const days = (args as { days?: number })?.days || 30;
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const calendar = await clients.lidarr.getCalendar(start, end);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: calendar.length,
              albums: calendar.map(a => ({
                id: a.id,
                title: a.title,
                artistId: a.artistId,
                releaseDate: a.releaseDate,
                albumType: a.albumType,
                monitored: a.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "lidarr_add_artist": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const { foreignArtistId, artistName, qualityProfileId, metadataProfileId, rootFolderPath, monitored } = args as {
          foreignArtistId: string; artistName: string; qualityProfileId: number;
          metadataProfileId: number; rootFolderPath: string; monitored?: boolean;
        };
        const added = await clients.lidarr.addArtist({
          foreignArtistId, artistName, qualityProfileId, metadataProfileId, rootFolderPath, monitored,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Added "${added.artistName}" to Lidarr`,
              id: added.id,
              path: added.path,
              monitored: added.monitored,
            }, null, 2),
          }],
        };
      }

      case "lidarr_get_root_folders": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const folders = await clients.lidarr.getRootFolders();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(folders, null, 2),
          }],
        };
      }

      case "lidarr_get_quality_profiles": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const profiles = await clients.lidarr.getQualityProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      case "lidarr_get_metadata_profiles": {
        if (!clients.lidarr) throw new Error("Lidarr not configured");
        const profiles = await clients.lidarr.getMetadataProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      // Readarr handlers
      case "readarr_get_authors": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const authors = await clients.readarr.getAuthors();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: authors.length,
              authors: authors.map(a => ({
                id: a.id,
                authorName: a.authorName,
                status: a.status,
                books: a.statistics?.bookFileCount + '/' + a.statistics?.totalBookCount,
                sizeOnDisk: formatBytes(a.statistics?.sizeOnDisk || 0),
                monitored: a.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "readarr_search": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const term = (args as { term: string }).term;
        const results = await clients.readarr.searchAuthors(term);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: results.length,
              results: results.slice(0, 10).map(r => ({
                title: r.title,
                foreignAuthorId: r.foreignAuthorId,
                overview: r.overview?.substring(0, 200) + (r.overview && r.overview.length > 200 ? '...' : ''),
              })),
            }, null, 2),
          }],
        };
      }

      case "readarr_get_queue": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const queue = await clients.readarr.getQueue();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalRecords: queue.totalRecords,
              items: queue.records.map(q => ({
                title: q.title,
                status: q.status,
                progress: ((1 - q.sizeleft / q.size) * 100).toFixed(1) + '%',
                timeLeft: q.timeleft,
                downloadClient: q.downloadClient,
              })),
            }, null, 2),
          }],
        };
      }

      case "readarr_get_books": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const authorId = (args as { authorId: number }).authorId;
        const books = await clients.readarr.getBooks(authorId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: books.length,
              books: books.map(b => ({
                id: b.id,
                title: b.title,
                releaseDate: b.releaseDate,
                pageCount: b.pageCount,
                monitored: b.monitored,
                hasFile: b.statistics ? b.statistics.bookFileCount > 0 : false,
                sizeOnDisk: formatBytes(b.statistics?.sizeOnDisk || 0),
                grabbed: b.grabbed,
              })),
            }, null, 2),
          }],
        };
      }

      case "readarr_search_book": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const bookIds = (args as { bookIds: number[] }).bookIds;
        const result = await clients.readarr.searchBook(bookIds);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for ${bookIds.length} book(s)`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "readarr_search_missing": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const authorId = (args as { authorId: number }).authorId;
        const result = await clients.readarr.searchMissingBooks(authorId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Search triggered for missing books`,
              commandId: result.id,
            }, null, 2),
          }],
        };
      }

      case "readarr_get_calendar": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const days = (args as { days?: number })?.days || 30;
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const calendar = await clients.readarr.getCalendar(start, end);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: calendar.length,
              books: calendar.map(b => ({
                id: b.id,
                title: b.title,
                authorId: b.authorId,
                releaseDate: b.releaseDate,
                monitored: b.monitored,
              })),
            }, null, 2),
          }],
        };
      }

      case "readarr_add_author": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const { foreignAuthorId, authorName, qualityProfileId, metadataProfileId, rootFolderPath, monitored } = args as {
          foreignAuthorId: string; authorName: string; qualityProfileId: number;
          metadataProfileId: number; rootFolderPath: string; monitored?: boolean;
        };
        const added = await clients.readarr.addAuthor({
          foreignAuthorId, authorName, qualityProfileId, metadataProfileId, rootFolderPath, monitored,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Added "${added.authorName}" to Readarr`,
              id: added.id,
              path: added.path,
              monitored: added.monitored,
            }, null, 2),
          }],
        };
      }

      case "readarr_get_root_folders": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const folders = await clients.readarr.getRootFolders();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(folders, null, 2),
          }],
        };
      }

      case "readarr_get_quality_profiles": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const profiles = await clients.readarr.getQualityProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      case "readarr_get_metadata_profiles": {
        if (!clients.readarr) throw new Error("Readarr not configured");
        const profiles = await clients.readarr.getMetadataProfiles();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name })), null, 2),
          }],
        };
      }

      // Prowlarr handlers
      case "prowlarr_get_indexers": {
        if (!clients.prowlarr) throw new Error("Prowlarr not configured");
        const indexers = await clients.prowlarr.getIndexers();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: indexers.length,
              indexers: indexers.map(i => ({
                id: i.id,
                name: i.name,
                protocol: i.protocol,
                enableRss: i.enableRss,
                enableAutomaticSearch: i.enableAutomaticSearch,
                enableInteractiveSearch: i.enableInteractiveSearch,
                priority: i.priority,
              })),
            }, null, 2),
          }],
        };
      }

      case "prowlarr_search": {
        if (!clients.prowlarr) throw new Error("Prowlarr not configured");
        const query = (args as { query: string }).query;
        const results = await clients.prowlarr.search(query);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "prowlarr_test_indexers": {
        if (!clients.prowlarr) throw new Error("Prowlarr not configured");
        const results = await clients.prowlarr.testAllIndexers();
        const indexers = await clients.prowlarr.getIndexers();
        const indexerMap = new Map(indexers.map(i => [i.id, i.name]));
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: results.length,
              indexers: results.map(r => ({
                id: r.id,
                name: indexerMap.get(r.id) || 'Unknown',
                isValid: r.isValid,
                errors: r.validationFailures.map(f => f.errorMessage),
              })),
              healthy: results.filter(r => r.isValid).length,
              failed: results.filter(r => !r.isValid).length,
            }, null, 2),
          }],
        };
      }

      case "prowlarr_get_stats": {
        if (!clients.prowlarr) throw new Error("Prowlarr not configured");
        const stats = await clients.prowlarr.getIndexerStats();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: stats.indexers.length,
              indexers: stats.indexers.map(s => ({
                name: s.indexerName,
                queries: s.numberOfQueries,
                grabs: s.numberOfGrabs,
                failedQueries: s.numberOfFailedQueries,
                failedGrabs: s.numberOfFailedGrabs,
                avgResponseTime: s.averageResponseTime + 'ms',
              })),
              totals: {
                queries: stats.indexers.reduce((sum, s) => sum + s.numberOfQueries, 0),
                grabs: stats.indexers.reduce((sum, s) => sum + s.numberOfGrabs, 0),
                failedQueries: stats.indexers.reduce((sum, s) => sum + s.numberOfFailedQueries, 0),
                failedGrabs: stats.indexers.reduce((sum, s) => sum + s.numberOfFailedGrabs, 0),
              },
            }, null, 2),
          }],
        };
      }

      // Cross-service search
      case "arr_search_all": {
        const term = (args as { term: string }).term;
        const results: Record<string, unknown> = {};

        if (clients.sonarr) {
          try {
            const sonarrResults = await clients.sonarr.searchSeries(term);
            results.sonarr = { count: sonarrResults.length, results: sonarrResults.slice(0, 5) };
          } catch (e) {
            results.sonarr = { error: e instanceof Error ? e.message : String(e) };
          }
        }

        if (clients.radarr) {
          try {
            const radarrResults = await clients.radarr.searchMovies(term);
            results.radarr = { count: radarrResults.length, results: radarrResults.slice(0, 5) };
          } catch (e) {
            results.radarr = { error: e instanceof Error ? e.message : String(e) };
          }
        }

        if (clients.lidarr) {
          try {
            const lidarrResults = await clients.lidarr.searchArtists(term);
            results.lidarr = { count: lidarrResults.length, results: lidarrResults.slice(0, 5) };
          } catch (e) {
            results.lidarr = { error: e instanceof Error ? e.message : String(e) };
          }
        }

        if (clients.readarr) {
          try {
            const readarrResults = await clients.readarr.searchAuthors(term);
            results.readarr = { count: readarrResults.length, results: readarrResults.slice(0, 5) };
          } catch (e) {
            results.readarr = { error: e instanceof Error ? e.message : String(e) };
          }
        }

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      // TRaSH Guides handlers
      case "trash_list_profiles": {
        const service = (args as { service: TrashService }).service;
        const profiles = await trashClient.listProfiles(service);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              service,
              count: profiles.length,
              profiles: profiles.map(p => ({
                name: p.name,
                description: p.description?.replace(/<br>/g, ' ') || 'No description',
              })),
              usage: "Use trash_get_profile to see full details for a specific profile",
            }, null, 2),
          }],
        };
      }

      case "trash_get_profile": {
        const { service, profile: profileName } = args as { service: TrashService; profile: string };
        const profile = await trashClient.getProfile(service, profileName);
        if (!profile) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Profile '${profileName}' not found for ${service}`,
                hint: "Use trash_list_profiles to see available profiles",
              }, null, 2),
            }],
            isError: true,
          };
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: profile.name,
              description: profile.trash_description?.replace(/<br>/g, '\n'),
              trash_id: profile.trash_id,
              upgradeAllowed: profile.upgradeAllowed,
              cutoff: profile.cutoff,
              minFormatScore: profile.minFormatScore,
              cutoffFormatScore: profile.cutoffFormatScore,
              language: profile.language,
              qualities: profile.items.map(i => ({
                name: i.name,
                allowed: i.allowed,
                items: i.items,
              })),
              customFormats: Object.entries(profile.formatItems || {}).map(([name, trashId]) => ({
                name,
                trash_id: trashId,
              })),
            }, null, 2),
          }],
        };
      }

      case "trash_list_custom_formats": {
        const { service, category } = args as { service: TrashService; category?: string };
        const formats = await trashClient.listCustomFormats(service, category);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              service,
              category: category || 'all',
              count: formats.length,
              formats: formats.slice(0, 50).map(f => ({
                name: f.name,
                categories: f.categories,
                defaultScore: f.defaultScore,
              })),
              note: formats.length > 50 ? `Showing first 50 of ${formats.length}. Use category filter to narrow results.` : undefined,
              availableCategories: ['hdr', 'audio', 'resolution', 'source', 'streaming', 'anime', 'unwanted', 'release', 'language'],
            }, null, 2),
          }],
        };
      }

      case "trash_get_naming": {
        const { service, mediaServer } = args as { service: TrashService; mediaServer: string };
        const naming = await trashClient.getNaming(service);
        if (!naming) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `Could not fetch naming conventions for ${service}` }, null, 2),
            }],
            isError: true,
          };
        }

        // Map media server to naming key
        const serverMap: Record<string, { folder: string; file: string }> = {
          plex: { folder: 'plex-imdb', file: 'plex-imdb' },
          emby: { folder: 'emby-imdb', file: 'emby-imdb' },
          jellyfin: { folder: 'jellyfin-imdb', file: 'jellyfin-imdb' },
          standard: { folder: 'default', file: 'standard' },
        };

        const keys = serverMap[mediaServer] || serverMap.standard;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              service,
              mediaServer,
              recommended: {
                folder: naming.folder[keys.folder] || naming.folder.default,
                file: naming.file[keys.file] || naming.file.standard,
                ...(naming.season && { season: naming.season[keys.folder] || naming.season.default }),
                ...(naming.series && { series: naming.series[keys.folder] || naming.series.default }),
              },
              allFolderOptions: Object.keys(naming.folder),
              allFileOptions: Object.keys(naming.file),
            }, null, 2),
          }],
        };
      }

      case "trash_get_quality_sizes": {
        const { service, type } = args as { service: TrashService; type?: string };
        const sizes = await trashClient.getQualitySizes(service, type);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              service,
              type: type || 'all',
              profiles: sizes.map(s => ({
                type: s.type,
                qualities: s.qualities.map(q => ({
                  quality: q.quality,
                  min: q.min + ' MB/min',
                  preferred: q.preferred === 1999 ? 'unlimited' : q.preferred + ' MB/min',
                  max: q.max === 2000 ? 'unlimited' : q.max + ' MB/min',
                })),
              })),
            }, null, 2),
          }],
        };
      }

      case "trash_compare_profile": {
        const { service, profileId, trashProfile } = args as {
          service: TrashService;
          profileId: number;
          trashProfile: string;
        };

        // Get client
        const client = service === 'radarr' ? clients.radarr : clients.sonarr;
        if (!client) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `${service} not configured. Cannot compare profiles.` }, null, 2),
            }],
            isError: true,
          };
        }

        // Fetch both profiles
        const [userProfiles, trashProfileData] = await Promise.all([
          client.getQualityProfiles(),
          trashClient.getProfile(service, trashProfile),
        ]);

        const userProfile = userProfiles.find(p => p.id === profileId);
        if (!userProfile) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Profile ID ${profileId} not found`,
                availableProfiles: userProfiles.map(p => ({ id: p.id, name: p.name })),
              }, null, 2),
            }],
            isError: true,
          };
        }

        if (!trashProfileData) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `TRaSH profile '${trashProfile}' not found`,
                hint: "Use trash_list_profiles to see available profiles",
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Compare qualities
        const userQualities = new Set<string>(
          userProfile.items
            .filter(i => i.allowed)
            .map(i => i.quality?.name || i.name)
            .filter((n): n is string => n !== undefined)
        );
        const trashQualities = new Set<string>(
          trashProfileData.items
            .filter(i => i.allowed)
            .map(i => i.name)
        );

        const qualityComparison = {
          matching: [...userQualities].filter(q => trashQualities.has(q)),
          missingFromYours: [...trashQualities].filter(q => !userQualities.has(q)),
          extraInYours: [...userQualities].filter(q => !trashQualities.has(q)),
        };

        // Compare custom formats
        const userCFNames = new Set(
          (userProfile.formatItems || [])
            .filter(f => f.score !== 0)
            .map(f => f.name)
        );
        const trashCFNames = new Set(Object.keys(trashProfileData.formatItems || {}));

        const cfComparison = {
          matching: [...userCFNames].filter(cf => trashCFNames.has(cf)),
          missingFromYours: [...trashCFNames].filter(cf => !userCFNames.has(cf)),
          extraInYours: [...userCFNames].filter(cf => !trashCFNames.has(cf)),
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              yourProfile: {
                name: userProfile.name,
                id: userProfile.id,
                upgradeAllowed: userProfile.upgradeAllowed,
                cutoff: userProfile.cutoff,
              },
              trashProfile: {
                name: trashProfileData.name,
                upgradeAllowed: trashProfileData.upgradeAllowed,
                cutoff: trashProfileData.cutoff,
              },
              qualityComparison,
              customFormatComparison: cfComparison,
              recommendations: [
                ...(qualityComparison.missingFromYours.length > 0
                  ? [`Enable these qualities: ${qualityComparison.missingFromYours.join(', ')}`]
                  : []),
                ...(cfComparison.missingFromYours.length > 0
                  ? [`Add these custom formats: ${cfComparison.missingFromYours.slice(0, 5).join(', ')}${cfComparison.missingFromYours.length > 5 ? ` and ${cfComparison.missingFromYours.length - 5} more` : ''}`]
                  : []),
                ...(userProfile.upgradeAllowed !== trashProfileData.upgradeAllowed
                  ? [`Set upgradeAllowed to ${trashProfileData.upgradeAllowed}`]
                  : []),
              ],
            }, null, 2),
          }],
        };
      }

      case "trash_compare_naming": {
        const { service, mediaServer } = args as { service: TrashService; mediaServer: string };

        // Get client
        const client = service === 'radarr' ? clients.radarr : clients.sonarr;
        if (!client) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `${service} not configured. Cannot compare naming.` }, null, 2),
            }],
            isError: true,
          };
        }

        // Fetch both
        const [userNaming, trashNaming] = await Promise.all([
          client.getNamingConfig(),
          trashClient.getNaming(service),
        ]);

        if (!trashNaming) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: `Could not fetch TRaSH naming for ${service}` }, null, 2),
            }],
            isError: true,
          };
        }

        // Map media server to naming key
        const serverMap: Record<string, { folder: string; file: string }> = {
          plex: { folder: 'plex-imdb', file: 'plex-imdb' },
          emby: { folder: 'emby-imdb', file: 'emby-imdb' },
          jellyfin: { folder: 'jellyfin-imdb', file: 'jellyfin-imdb' },
          standard: { folder: 'default', file: 'standard' },
        };

        const keys = serverMap[mediaServer] || serverMap.standard;
        const recommendedFolder = trashNaming.folder[keys.folder] || trashNaming.folder.default;
        const recommendedFile = trashNaming.file[keys.file] || trashNaming.file.standard;

        // Extract user's current naming (field names vary by service)
        const namingRecord = userNaming as unknown as Record<string, unknown>;
        const userFolder = namingRecord.movieFolderFormat ||
          namingRecord.seriesFolderFormat ||
          namingRecord.standardMovieFormat;
        const userFile = namingRecord.standardMovieFormat ||
          namingRecord.standardEpisodeFormat;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              mediaServer,
              yourNaming: {
                folder: userFolder,
                file: userFile,
              },
              trashRecommended: {
                folder: recommendedFolder,
                file: recommendedFile,
              },
              folderMatch: userFolder === recommendedFolder,
              fileMatch: userFile === recommendedFile,
              recommendations: [
                ...(userFolder !== recommendedFolder ? [`Update folder format to: ${recommendedFolder}`] : []),
                ...(userFile !== recommendedFile ? [`Update file format to: ${recommendedFile}`] : []),
              ],
            }, null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`*arr MCP server running - configured services: ${configuredServices.map(s => s.name).join(', ')}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
