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
import { supabaseBibleService } from './SupabaseBibleService';

class BibleService {
  // Use multiple data sources with priority order
  private supabaseService = supabaseBibleService;
  private csvService = csvBibleService;
  private gatewayService = bibleGatewayService;

  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    console.log(`🔍 Searching for passage: ${book} ${chapter}:${verses}`);
    
    try {
      // Try Supabase JSON service first (highest priority)
      if (this.supabaseService.isLoaded() && this.supabaseService.hasData()) {
        console.log('📖 Trying Supabase JSON service...');
        const passage = await this.supabaseService.getPassage(book, chapter, verses);
        if (passage) {
          console.log('✅ Found passage in Supabase JSON service');
          return passage;
        } else {
          console.log('❌ Passage not found in Supabase JSON service');
        }
      } else {
        console.log('⏳ Supabase JSON service not ready or has no data');
      }
    } catch (error) {
      console.warn('⚠️ Error fetching from Supabase JSON service:', error);
    }

    try {
      // Try to get from CSV service first
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

    // Fallback to Bible Gateway service
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
      // Try Supabase JSON service first
      if (this.supabaseService.hasData()) {
        const results = await this.supabaseService.searchVerses(query, limit);
        if (results.length > 0) {
          return results;
        }
      }
    } catch (error) {
      console.error('Error searching in Supabase JSON service:', error);
    }

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
      // Try Supabase service first
      if (this.supabaseService.hasData()) {
        return await this.supabaseService.getStats();
      }
    } catch (error) {
      console.error('Error getting stats from Supabase service:', error);
    }

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
    return this.supabaseService.isLoaded() || this.csvService.isLoaded();
  }

  // Check if we have any Bible data available
  hasData(): boolean {
    return this.supabaseService.hasData() || this.csvService.isLoaded();
  }

  // Get available books from the best available source
  getAvailableBooks(): string[] {
    if (this.supabaseService.hasData()) {
      return this.supabaseService.getAvailableBooks();
    }
    return []; // CSV service doesn't have this method, could be added
  }

  // Configure Supabase Bible service
  configureSupabaseSource(bucketName: string, fileName: string) {
    this.supabaseService.configure(bucketName, fileName);
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