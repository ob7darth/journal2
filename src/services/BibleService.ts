export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  book: string;
  chapter: number;
  verses: string;
  text: BibleVerse[];
}

import { bibleGatewayService } from './BibleGatewayService';
import { csvBibleService } from './CSVBibleService';

class BibleService {
  private csvService = csvBibleService;
  private gatewayService = bibleGatewayService;

  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    try {
      const passage = await this.csvService.getPassage(book, chapter, verses);
      if (passage) {
        return passage;
      }
    } catch (error) {
      console.warn('Error fetching from CSV service:', error);
    }

    try {
      return await this.gatewayService.getPassage(book, chapter, verses);
    } catch (error) {
      console.warn('Error fetching from Bible Gateway service:', error);
      return null;
    }
  }

  async searchVerses(query: string, limit: number = 20): Promise<BibleVerse[]> {
    try {
      const results = await this.csvService.searchVerses(query, limit);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn('Error searching in CSV service:', error);
    }

    try {
      return await this.gatewayService.searchVerses(query, limit);
    } catch (error) {
      console.warn('Error searching in Bible Gateway service:', error);
      return [];
    }
  }

  async getStats(): Promise<{totalVerses: number, totalBooks: number, totalChapters: number}> {
    try {
      return await this.csvService.getStats();
    } catch (error) {
      console.warn('Error getting stats from CSV service:', error);
      return {
        totalVerses: 0,
        totalBooks: 0,
        totalChapters: 0
      };
    }
  }

  isLoaded(): boolean {
    return this.csvService.isLoaded();
  }

  hasData(): boolean {
    return this.csvService.isLoaded();
  }

  getBibleGatewayUrl(book: string, chapter: number, verses: string, version: string = 'NASB'): string {
    return this.gatewayService.getBibleGatewayUrl(book, chapter, verses, version);
  }

  getBibleGatewaySearchUrl(query: string, version: string = 'NASB'): string {
    return this.gatewayService.getBibleGatewaySearchUrl(query, version);
  }
}

export const bibleService = new BibleService();