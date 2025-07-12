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

import { csvBibleService } from './CSVBibleService';
import { bibleGatewayService } from './BibleGatewayService';

class BibleService {
  // Use CSV service for local data and Bible Gateway for external access
  private csvService = csvBibleService;
  private gatewayService = bibleGatewayService;

  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    console.log(`🔍 Searching for passage: ${book} ${chapter}:${verses}`);
    
    try {
      // Try to get from CSV service first for basic functionality
      console.log('📄 Trying CSV service...');
      const passage = await this.csvService.getPassage(book, chapter, verses);
      if (passage) {
        console.log('✅ Found passage in CSV service');
        return passage;
      } else {
        console.log('❌ Passage not found in CSV service');
      }
    } catch (error) {
      console.warn('⚠️ Error fetching from CSV service:', error);
    }

    // Always provide Bible Gateway fallback
    try {
      console.log('🌐 Falling back to Bible Gateway for passage:', book, chapter, verses);
      return await this.gatewayService.getPassage(book, chapter, verses);
    } catch (error) {
      console.warn('⚠️ Error fetching from Bible Gateway service:', error);
      return null;
    }
  }

  async searchVerses(query: string, limit: number = 20): Promise<BibleVerse[]> {
    try {
      // Try to search in CSV service first
      const results = await this.csvService.searchVerses(query, limit);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.error('Error searching in CSV service:', error);
    }

    // Fallback to Bible Gateway service
    try {
      console.log('Falling back to Bible Gateway for search:', query);
      return await this.gatewayService.searchVerses(query, limit);
    } catch (error) {
      console.error('Error searching in Bible Gateway service:', error);
      return [];
    }
  }

  async getStats(): Promise<{totalVerses: number, totalBooks: number, totalChapters: number}> {
    try {
      return await this.csvService.getStats();
    } catch (error) {
      console.error('Error getting stats from CSV service:', error);
      return {
        totalVerses: 0,
        totalBooks: 0,
        totalChapters: 0
      };
    }
  }

  // Check if Bible data is loaded
  isLoaded(): boolean {
    return this.csvService.isLoaded();
  }

  // Check if we have any Bible data available
  hasData(): boolean {
    return this.csvService.isLoaded();
  }

  // Get Bible Gateway URL for external access
  getBibleGatewayUrl(book: string, chapter: number, verses: string, version: string = 'ASV'): string {
    return this.gatewayService.getBibleGatewayUrl(book, chapter, verses, version);
  }

  // Get Bible Gateway search URL
  getBibleGatewaySearchUrl(query: string, version: string = 'ASV'): string {
    return this.gatewayService.getBibleGatewaySearchUrl(query, version);
  }
}

export const bibleService = new BibleService();