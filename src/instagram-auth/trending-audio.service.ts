import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TrendingAudioItem {
  rank: number;
  direction: 'up' | 'down' | 'new';
  title: string;
  artist: string;
  reelsCount: string;
  imageUrl: string;
  previewUrl?: string;
  isrc?: string;
}

type ScrapedSong = {
  title: string;
  artist: string;
  imageUrl?: string;
};

@Injectable()
export class TrendingAudioService implements OnModuleInit {
  private readonly logger = new Logger(TrendingAudioService.name);
  private cachedSongs: TrendingAudioItem[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (this.cachedSongs.length === 0) {
      await this.fetchAndCacheTrendingSongs();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running daily Apple Music Viral Hits scraper...');
    await this.fetchAndCacheTrendingSongs();
  }

  async getTrendingAudio(): Promise<TrendingAudioItem[]> {
    if (this.cachedSongs.length > 0) {
      return this.cachedSongs;
    }
    return this.getMockTrendingAudio();
  }

  private async fetchAndCacheTrendingSongs() {
    const playlistUrl = this.configService.get<string>('APPLE_MUSIC_PLAYLIST_URL')
      || 'https://music.apple.com/us/playlist/reels-instagram-viral-hits/pl.f4d106fed2bd41149aaacabb233eb5eb';

    try {
      const { data: html } = await axios.get<string>(playlistUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 20000,
      });

      const $ = cheerio.load(html);
      let scrapedSongs = this.extractSongsFromSerializedData($);

      // Fallback if Apple changes JSON payload structure.
      if (scrapedSongs.length === 0) {
        scrapedSongs = this.extractSongsFromDom($);
      }

      if (scrapedSongs.length === 0) {
        this.logger.warn('Apple Music scrape returned 0 tracks. Keeping previous cache.');
        return;
      }

      const uniqueSongs = this.dedupeSongs(scrapedSongs).slice(0, 15);

      const enrichedSongs = await Promise.all(
        uniqueSongs.map(async (song, index) => {
          const previewData = await this.getAudioPreview(song.title, song.artist);

          return {
            rank: index + 1,
            direction: 'new' as const,
            title: previewData?.title || song.title,
            artist: previewData?.artist || song.artist,
            reelsCount: 'Popular on Reels',
            imageUrl: previewData?.cover || song.imageUrl || 'https://picsum.photos/200',
            previewUrl: previewData?.previewUrl,
            isrc: previewData?.isrc,
          };
        }),
      );

      const readySongs = enrichedSongs.filter((song) => !!song.title && !!song.artist);
      if (readySongs.length === 0) {
        this.logger.warn('Track enrichment returned 0 songs. Keeping previous cache.');
        return;
      }

      this.cachedSongs = readySongs;
      this.logger.log(`Successfully cached ${this.cachedSongs.length} viral hits.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scraping failed: ${message}`);
    }
  }

  private extractSongsFromSerializedData($: cheerio.CheerioAPI): ScrapedSong[] {
    const raw = $('#serialized-server-data').text();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as any;
      const songs: ScrapedSong[] = [];

      this.walkObjects(parsed, (obj) => {
        const title = typeof obj?.title === 'string' ? obj.title.trim() : '';
        const artist = typeof obj?.subtitleLinks?.[0]?.title === 'string'
          ? obj.subtitleLinks[0].title.trim()
          : '';

        // Apple exposes tracks as plain objects under a single "trackLockup" section.
        const looksLikeTrack = Boolean(
          title
          && artist
          && (typeof obj?.trackNumber === 'number'
            || obj?.contentDescriptor?.kind === 'song'
            || typeof obj?.duration === 'number'),
        );

        if (!looksLikeTrack) return;

        const artworkTemplate = typeof obj?.artwork?.dictionary?.url === 'string'
          ? obj.artwork.dictionary.url
          : '';
        const imageUrl = artworkTemplate
          ? artworkTemplate
            .replace('{w}', '200')
            .replace('{h}', '200')
            .replace('{f}', 'jpg')
          : undefined;

        songs.push({ title, artist, imageUrl });
      });

      return songs;
    } catch {
      return [];
    }
  }

  private extractSongsFromDom($: cheerio.CheerioAPI): ScrapedSong[] {
    const songs: ScrapedSong[] = [];

    $('.songs-list-row').each((_index, element) => {
      const title = $(element).find('.songs-list-row__song-name').text().trim();
      const artist = $(element).find('.songs-list-row__by-line').text().trim();
      const imageUrl = $(element).find('img').attr('src');

      if (title && artist) {
        songs.push({ title, artist, imageUrl });
      }
    });

    return songs;
  }

  private dedupeSongs(songs: ScrapedSong[]): ScrapedSong[] {
    const seen = new Set<string>();
    const deduped: ScrapedSong[] = [];

    for (const song of songs) {
      const key = `${song.title.toLowerCase()}::${song.artist.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(song);
    }

    return deduped;
  }

  private walkObjects(node: unknown, visitor: (obj: Record<string, any>) => void): void {
    if (Array.isArray(node)) {
      for (const item of node) {
        this.walkObjects(item, visitor);
      }
      return;
    }

    if (node && typeof node === 'object') {
      const obj = node as Record<string, any>;
      visitor(obj);
      for (const value of Object.values(obj)) {
        this.walkObjects(value, visitor);
      }
    }
  }

  private async getAudioPreview(title: string, artist: string) {
    try {
      const query = encodeURIComponent(`${title} ${artist}`);
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

      const { data } = await axios.get(url, { timeout: 6000 });
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          title: result.trackName as string,
          artist: result.artistName as string,
          previewUrl: result.previewUrl as string,
          cover: (result.artworkUrl100 as string)?.replace('100x100', '200x200'),
          isrc: result.isrc as string,
        };
      }
    } catch (_e) {
      return null;
    }

    return null;
  }

  private getMockTrendingAudio(): TrendingAudioItem[] {
    return [
      { rank: 1, direction: 'new', title: 'Llayda Fell Jay (MEDU BEATS...', artist: 'MEDU', reelsCount: '6.4K reels', imageUrl: 'https://picsum.photos/200?random=1' },
      { rank: 2, direction: 'new', title: 'Barra Eneramo', artist: 'Taraji Music, Curva Sud Tunis...', reelsCount: 'Popular', imageUrl: 'https://picsum.photos/200?random=2' },
      { rank: 3, direction: 'new', title: 'Original audio', artist: 'httpoa_', reelsCount: '7.9K reels', imageUrl: 'https://picsum.photos/200?random=3' },
      { rank: 4, direction: 'new', title: 'Original audio', artist: 'dhia_dragon', reelsCount: '32 reels', imageUrl: 'https://picsum.photos/200?random=4' },
      { rank: 5, direction: 'new', title: 'OMMA', artist: 'Kaso', reelsCount: '673 reels', imageUrl: 'https://picsum.photos/200?random=5' },
    ];
  }
}
