/**
 * *arr Suite API Client
 *
 * All *arr applications (Sonarr, Radarr, Lidarr, Readarr, Prowlarr) use
 * the same REST API pattern with X-Api-Key header authentication.
 */

export type ArrService = 'sonarr' | 'radarr' | 'lidarr' | 'readarr' | 'prowlarr';

export interface ArrConfig {
  url: string;
  apiKey: string;
}

export interface SystemStatus {
  appName: string;
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  isDocker: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
}

export interface QueueItem {
  id: number;
  title: string;
  status: string;
  trackedDownloadStatus: string;
  trackedDownloadState: string;
  statusMessages: Array<{ title: string; messages: string[] }>;
  downloadId: string;
  protocol: string;
  downloadClient: string;
  outputPath: string;
  sizeleft: number;
  size: number;
  timeleft: string;
  estimatedCompletionTime: string;
}

export interface Series {
  id: number;
  title: string;
  sortTitle: string;
  status: string;
  overview: string;
  network: string;
  airTime: string;
  images: Array<{ coverType: string; url: string }>;
  seasons: Array<{ seasonNumber: number; monitored: boolean }>;
  year: number;
  path: string;
  qualityProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  seriesType: string;
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: { votes: number; value: number };
  statistics: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface Episode {
  id: number;
  seriesId: number;
  tvdbId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  overview: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber: number;
  unverifiedSceneNumbering: boolean;
  episodeFile?: {
    id: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    quality: { quality: { id: number; name: string } };
  };
}

export interface Book {
  id: number;
  title: string;
  authorId: number;
  foreignBookId: string;
  titleSlug: string;
  overview: string;
  releaseDate: string;
  pageCount: number;
  monitored: boolean;
  grabbed: boolean;
  ratings: { votes: number; value: number };
  editions: Array<{
    id: number;
    bookId: number;
    foreignEditionId: string;
    title: string;
    pageCount: number;
    isEbook: boolean;
    monitored: boolean;
  }>;
  statistics?: {
    bookFileCount: number;
    bookCount: number;
    totalBookCount: number;
    sizeOnDisk: number;
    percentOfBooks: number;
  };
}

export interface Movie {
  id: number;
  title: string;
  sortTitle: string;
  sizeOnDisk: number;
  status: string;
  overview: string;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  images: Array<{ coverType: string; url: string }>;
  website: string;
  year: number;
  hasFile: boolean;
  youTubeTrailerId: string;
  studio: string;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  isAvailable: boolean;
  folderName: string;
  runtime: number;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: { votes: number; value: number };
  movieFile?: {
    id: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    quality: { quality: { id: number; name: string } };
  };
}

export interface Album {
  id: number;
  title: string;
  disambiguation: string;
  overview: string;
  artistId: number;
  foreignAlbumId: string;
  monitored: boolean;
  anyReleaseOk: boolean;
  profileId: number;
  duration: number;
  albumType: string;
  genres: string[];
  images: Array<{ coverType: string; url: string }>;
  links: Array<{ url: string; name: string }>;
  statistics?: {
    trackFileCount: number;
    trackCount: number;
    totalTrackCount: number;
    sizeOnDisk: number;
    percentOfTracks: number;
  };
  releaseDate: string;
  releases: Array<{
    id: number;
    albumId: number;
    foreignReleaseId: string;
    title: string;
    status: string;
    duration: number;
    trackCount: number;
    monitored: boolean;
  }>;
  grabbed: boolean;
}

export interface Artist {
  id: number;
  artistName: string;
  sortName: string;
  status: string;
  overview: string;
  artistType: string;
  disambiguation: string;
  links: Array<{ url: string; name: string }>;
  images: Array<{ coverType: string; url: string }>;
  path: string;
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
  monitorNewItems: string;
  genres: string[];
  cleanName: string;
  foreignArtistId: string;
  tags: number[];
  added: string;
  ratings: { votes: number; value: number };
  statistics: {
    albumCount: number;
    trackFileCount: number;
    trackCount: number;
    totalTrackCount: number;
    sizeOnDisk: number;
    percentOfTracks: number;
  };
}

export interface Author {
  id: number;
  authorName: string;
  sortName: string;
  status: string;
  overview: string;
  links: Array<{ url: string; name: string }>;
  images: Array<{ coverType: string; url: string }>;
  path: string;
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
  monitorNewItems: string;
  genres: string[];
  cleanName: string;
  foreignAuthorId: string;
  tags: number[];
  added: string;
  ratings: { votes: number; value: number; popularity: number };
  statistics: {
    bookFileCount: number;
    bookCount: number;
    totalBookCount: number;
    sizeOnDisk: number;
    percentOfBooks: number;
  };
}

export interface Indexer {
  id: number;
  name: string;
  enableRss: boolean;
  enableAutomaticSearch: boolean;
  enableInteractiveSearch: boolean;
  protocol: string;
  priority: number;
  added: string;
}

// Configuration interfaces
export interface QualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
  items: Array<{
    id?: number;
    name?: string;
    quality?: { id: number; name: string; source: string; resolution: number };
    items?: Array<{ quality: { id: number; name: string } }>;
    allowed: boolean;
  }>;
  minFormatScore: number;
  cutoffFormatScore: number;
  formatItems: Array<{
    format: number;
    name: string;
    score: number;
  }>;
}

export interface QualityDefinition {
  id: number;
  quality: {
    id: number;
    name: string;
    source: string;
    resolution: number;
  };
  title: string;
  weight: number;
  minSize: number;
  maxSize: number;
  preferredSize: number;
}

export interface DownloadClient {
  id: number;
  name: string;
  implementation: string;
  implementationName: string;
  configContract: string;
  enable: boolean;
  protocol: string;
  priority: number;
  removeCompletedDownloads: boolean;
  removeFailedDownloads: boolean;
  fields: Array<{
    name: string;
    value: unknown;
  }>;
  tags: number[];
}

export interface NamingConfig {
  renameEpisodes?: boolean;
  replaceIllegalCharacters: boolean;
  colonReplacementFormat?: string;
  standardEpisodeFormat?: string;
  dailyEpisodeFormat?: string;
  animeEpisodeFormat?: string;
  seriesFolderFormat?: string;
  seasonFolderFormat?: string;
  specialsFolderFormat?: string;
  multiEpisodeStyle?: number;
  // Radarr
  renameMovies?: boolean;
  movieFolderFormat?: string;
  standardMovieFormat?: string;
  // Lidarr
  renameTracks?: boolean;
  artistFolderFormat?: string;
  albumFolderFormat?: string;
  trackFormat?: string;
  // Readarr
  renameBooks?: boolean;
  authorFolderFormat?: string;
  bookFolderFormat?: string;
  standardBookFormat?: string;
}

export interface MediaManagementConfig {
  autoUnmonitorPreviouslyDownloadedEpisodes?: boolean;
  autoUnmonitorPreviouslyDownloadedMovies?: boolean;
  recycleBin: string;
  recycleBinCleanupDays: number;
  downloadPropersAndRepacks: string;
  createEmptySeriesFolders?: boolean;
  createEmptyMovieFolders?: boolean;
  deleteEmptyFolders: boolean;
  fileDate: string;
  rescanAfterRefresh: string;
  setPermissionsLinux: boolean;
  chmodFolder: string;
  chownGroup: string;
  episodeTitleRequired?: string;
  skipFreeSpaceCheckWhenImporting: boolean;
  minimumFreeSpaceWhenImporting: number;
  copyUsingHardlinks: boolean;
  importExtraFiles: boolean;
  extraFileExtensions: string;
  enableMediaInfo: boolean;
}

export interface HealthCheck {
  source: string;
  type: string;
  message: string;
  wikiUrl: string;
}

export interface Tag {
  id: number;
  label: string;
}

export interface RootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  unmappedFolders?: Array<{ name: string; path: string }>;
}

export interface MetadataProfile {
  id: number;
  name: string;
  minPopularity?: number;
  skipMissingDate: boolean;
  skipMissingIsbn: boolean;
  skipPartsAndSets: boolean;
  skipSeriesSecondary: boolean;
  allowedLanguages?: string;
  minPages?: number;
}

export interface SearchResult {
  title: string;
  sortTitle: string;
  status: string;
  overview: string;
  year: number;
  images: Array<{ coverType: string; url: string }>;
  remotePoster?: string;
  // Sonarr specific
  tvdbId?: number;
  // Radarr specific
  tmdbId?: number;
  imdbId?: string;
  // Lidarr specific
  foreignArtistId?: string;
  artistName?: string;
  disambiguation?: string;
  // Readarr specific
  foreignAuthorId?: string;
}

export class ArrClient {
  private config: ArrConfig;
  private serviceName: ArrService;
  protected apiVersion: string = 'v3';

  constructor(serviceName: ArrService, config: ArrConfig) {
    this.serviceName = serviceName;
    this.config = {
      url: config.url.replace(/\/$/, ''),
      apiKey: config.apiKey
    };
  }

  /**
   * Make an API request
   */
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.url}/api/${this.apiVersion}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${this.serviceName} API error: ${response.status} ${response.statusText} - ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/system/status');
  }

  /**
   * Get download queue
   */
  async getQueue(): Promise<{ records: QueueItem[]; totalRecords: number }> {
    return this.request<{ records: QueueItem[]; totalRecords: number }>('/queue?includeUnknownSeriesItems=true&includeUnknownMovieItems=true');
  }

  /**
   * Get calendar items (upcoming releases)
   */
  async getCalendar(start?: string, end?: string): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<unknown[]>(`/calendar${query}`);
  }

  /**
   * Get all root folders
   */
  async getRootFolders(): Promise<Array<{ id: number; path: string; freeSpace: number }>> {
    return this.request<Array<{ id: number; path: string; freeSpace: number }>>('/rootfolder');
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get quality profiles
   */
  async getQualityProfiles(): Promise<QualityProfile[]> {
    return this.request<QualityProfile[]>('/qualityprofile');
  }

  /**
   * Get quality definitions (size limits)
   */
  async getQualityDefinitions(): Promise<QualityDefinition[]> {
    return this.request<QualityDefinition[]>('/qualitydefinition');
  }

  /**
   * Get download clients
   */
  async getDownloadClients(): Promise<DownloadClient[]> {
    return this.request<DownloadClient[]>('/downloadclient');
  }

  /**
   * Get naming configuration
   */
  async getNamingConfig(): Promise<NamingConfig> {
    return this.request<NamingConfig>('/config/naming');
  }

  /**
   * Get media management configuration
   */
  async getMediaManagement(): Promise<MediaManagementConfig> {
    return this.request<MediaManagementConfig>('/config/mediamanagement');
  }

  /**
   * Get health check issues
   */
  async getHealth(): Promise<HealthCheck[]> {
    return this.request<HealthCheck[]>('/health');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tag');
  }

  /**
   * Get detailed root folders
   */
  async getRootFoldersDetailed(): Promise<RootFolder[]> {
    return this.request<RootFolder[]>('/rootfolder');
  }

  /**
   * Get indexers (per-app configuration, not Prowlarr)
   */
  async getIndexers(): Promise<Indexer[]> {
    return this.request<Indexer[]>('/indexer');
  }
}

// Service-specific clients

export class SonarrClient extends ArrClient {
  constructor(config: ArrConfig) {
    super('sonarr', config);
  }

  /**
   * Get all series
   */
  async getSeries(): Promise<Series[]> {
    return this['request']<Series[]>('/series');
  }

  /**
   * Get a specific series
   */
  async getSeriesById(id: number): Promise<Series> {
    return this['request']<Series>(`/series/${id}`);
  }

  /**
   * Search for series
   */
  async searchSeries(term: string): Promise<SearchResult[]> {
    return this['request']<SearchResult[]>(`/series/lookup?term=${encodeURIComponent(term)}`);
  }

  /**
   * Add a series
   */
  async addSeries(series: Partial<Series> & { tvdbId: number; rootFolderPath: string; qualityProfileId: number }): Promise<Series> {
    return this['request']<Series>('/series', {
      method: 'POST',
      body: JSON.stringify({
        ...series,
        monitored: series.monitored ?? true,
        seasonFolder: series.seasonFolder ?? true,
        addOptions: {
          searchForMissingEpisodes: true,
        },
      }),
    });
  }

  /**
   * Trigger a search for missing episodes
   */
  async searchMissing(seriesId: number): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'SeriesSearch',
        seriesId,
      }),
    });
  }

  /**
   * Get episodes for a series, optionally filtered by season
   */
  async getEpisodes(seriesId: number, seasonNumber?: number): Promise<Episode[]> {
    let url = `/episode?seriesId=${seriesId}`;
    if (seasonNumber !== undefined) {
      url += `&seasonNumber=${seasonNumber}`;
    }
    return this['request']<Episode[]>(url);
  }

  /**
   * Search for a specific episode
   */
  async searchEpisode(episodeIds: number[]): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'EpisodeSearch',
        episodeIds,
      }),
    });
  }
}

export class RadarrClient extends ArrClient {
  constructor(config: ArrConfig) {
    super('radarr', config);
  }

  /**
   * Get all movies
   */
  async getMovies(): Promise<Movie[]> {
    return this['request']<Movie[]>('/movie');
  }

  /**
   * Get a specific movie
   */
  async getMovieById(id: number): Promise<Movie> {
    return this['request']<Movie>(`/movie/${id}`);
  }

  /**
   * Search for movies
   */
  async searchMovies(term: string): Promise<SearchResult[]> {
    return this['request']<SearchResult[]>(`/movie/lookup?term=${encodeURIComponent(term)}`);
  }

  /**
   * Add a movie
   */
  async addMovie(movie: Partial<Movie> & { tmdbId: number; rootFolderPath: string; qualityProfileId: number }): Promise<Movie> {
    return this['request']<Movie>('/movie', {
      method: 'POST',
      body: JSON.stringify({
        ...movie,
        monitored: movie.monitored ?? true,
        addOptions: {
          searchForMovie: true,
        },
      }),
    });
  }

  /**
   * Trigger a search for a movie
   */
  async searchMovie(movieId: number): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'MoviesSearch',
        movieIds: [movieId],
      }),
    });
  }
}

export class LidarrClient extends ArrClient {
  constructor(config: ArrConfig) {
    super('lidarr', config);
    this.apiVersion = 'v1';
  }

  /**
   * Get all artists
   */
  async getArtists(): Promise<Artist[]> {
    return this['request']<Artist[]>('/artist');
  }

  /**
   * Get a specific artist
   */
  async getArtistById(id: number): Promise<Artist> {
    return this['request']<Artist>(`/artist/${id}`);
  }

  /**
   * Search for artists
   */
  async searchArtists(term: string): Promise<SearchResult[]> {
    return this['request']<SearchResult[]>(`/artist/lookup?term=${encodeURIComponent(term)}`);
  }

  /**
   * Add an artist
   */
  async addArtist(artist: Partial<Artist> & { foreignArtistId: string; rootFolderPath: string; qualityProfileId: number; metadataProfileId: number }): Promise<Artist> {
    return this['request']<Artist>('/artist', {
      method: 'POST',
      body: JSON.stringify({
        ...artist,
        monitored: artist.monitored ?? true,
        addOptions: {
          searchForMissingAlbums: true,
        },
      }),
    });
  }

  /**
   * Get all albums, optionally filtered by artist
   */
  async getAlbums(artistId?: number): Promise<Album[]> {
    const url = artistId ? `/album?artistId=${artistId}` : '/album';
    return this['request']<Album[]>(url);
  }

  /**
   * Get a specific album
   */
  async getAlbumById(id: number): Promise<Album> {
    return this['request']<Album>(`/album/${id}`);
  }

  /**
   * Search for missing albums for an artist
   */
  async searchMissingAlbums(artistId: number): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'ArtistSearch',
        artistId,
      }),
    });
  }

  /**
   * Search for a specific album
   */
  async searchAlbum(albumId: number): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'AlbumSearch',
        albumIds: [albumId],
      }),
    });
  }

  /**
   * Get calendar (upcoming album releases)
   */
  async getCalendar(start?: string, end?: string): Promise<Album[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this['request']<Album[]>(`/calendar${query}`);
  }

  /**
   * Get metadata profiles
   */
  async getMetadataProfiles(): Promise<MetadataProfile[]> {
    return this['request']<MetadataProfile[]>('/metadataprofile');
  }
}

export class ReadarrClient extends ArrClient {
  constructor(config: ArrConfig) {
    super('readarr', config);
    this.apiVersion = 'v1';
  }

  /**
   * Get all authors
   */
  async getAuthors(): Promise<Author[]> {
    return this['request']<Author[]>('/author');
  }

  /**
   * Get a specific author
   */
  async getAuthorById(id: number): Promise<Author> {
    return this['request']<Author>(`/author/${id}`);
  }

  /**
   * Search for authors
   */
  async searchAuthors(term: string): Promise<SearchResult[]> {
    return this['request']<SearchResult[]>(`/author/lookup?term=${encodeURIComponent(term)}`);
  }

  /**
   * Add an author
   */
  async addAuthor(author: Partial<Author> & { foreignAuthorId: string; rootFolderPath: string; qualityProfileId: number; metadataProfileId: number }): Promise<Author> {
    return this['request']<Author>('/author', {
      method: 'POST',
      body: JSON.stringify({
        ...author,
        monitored: author.monitored ?? true,
        addOptions: {
          searchForMissingBooks: true,
        },
      }),
    });
  }

  /**
   * Get books for an author
   */
  async getBooks(authorId?: number): Promise<Book[]> {
    const url = authorId ? `/book?authorId=${authorId}` : '/book';
    return this['request']<Book[]>(url);
  }

  /**
   * Get a specific book
   */
  async getBookById(id: number): Promise<Book> {
    return this['request']<Book>(`/book/${id}`);
  }

  /**
   * Search for missing books for an author
   */
  async searchMissingBooks(authorId: number): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'AuthorSearch',
        authorId,
      }),
    });
  }

  /**
   * Search for a specific book
   */
  async searchBook(bookIds: number[]): Promise<{ id: number }> {
    return this['request']<{ id: number }>('/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'BookSearch',
        bookIds,
      }),
    });
  }

  /**
   * Get calendar (upcoming book releases)
   */
  async getCalendar(start?: string, end?: string): Promise<Book[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this['request']<Book[]>(`/calendar${query}`);
  }

  /**
   * Get metadata profiles
   */
  async getMetadataProfiles(): Promise<MetadataProfile[]> {
    return this['request']<MetadataProfile[]>('/metadataprofile');
  }
}

export interface IndexerStats {
  id: number;
  indexerId: number;
  indexerName: string;
  averageResponseTime: number;
  numberOfQueries: number;
  numberOfGrabs: number;
  numberOfRssQueries: number;
  numberOfAuthQueries: number;
  numberOfFailedQueries: number;
  numberOfFailedGrabs: number;
  numberOfFailedRssQueries: number;
  numberOfFailedAuthQueries: number;
}

export class ProwlarrClient extends ArrClient {
  constructor(config: ArrConfig) {
    super('prowlarr', config);
    this.apiVersion = 'v1';
  }

  /**
   * Get all indexers
   */
  async getIndexers(): Promise<Indexer[]> {
    return this['request']<Indexer[]>('/indexer');
  }

  /**
   * Test all indexers
   */
  async testAllIndexers(): Promise<Array<{ id: number; isValid: boolean; validationFailures: Array<{ propertyName: string; errorMessage: string }> }>> {
    return this['request']<Array<{ id: number; isValid: boolean; validationFailures: Array<{ propertyName: string; errorMessage: string }> }>>('/indexer/testall', { method: 'POST' });
  }

  /**
   * Test a specific indexer
   */
  async testIndexer(indexerId: number): Promise<{ id: number; isValid: boolean; validationFailures: Array<{ propertyName: string; errorMessage: string }> }> {
    return this['request']<{ id: number; isValid: boolean; validationFailures: Array<{ propertyName: string; errorMessage: string }> }>(`/indexer/${indexerId}/test`, { method: 'POST' });
  }

  /**
   * Get indexer statistics
   */
  async getIndexerStats(): Promise<{ indexers: IndexerStats[] }> {
    return this['request']<{ indexers: IndexerStats[] }>('/indexerstats');
  }

  /**
   * Search across all indexers
   */
  async search(query: string, categories?: number[]): Promise<unknown[]> {
    const params = new URLSearchParams({ query });
    if (categories) {
      categories.forEach(c => params.append('categories', c.toString()));
    }
    return this['request']<unknown[]>(`/search?${params.toString()}`);
  }
}
