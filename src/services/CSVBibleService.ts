import { supabase, canUseSupabase } from '../lib/supabase';
import { BibleVerse, BiblePassage } from './BibleService';

interface CSVVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

class CSVBibleService {
  private verses: Map<string, CSVVerse[]> = new Map();
  private _dataLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    // Auto-load on instantiation
    this.loadBibleData();
  }

  private async loadBibleData(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.fetchAndParseCSVData();
    return this.loadingPromise;
  }

  private async fetchAndParseCSVData(): Promise<void> {
    try {
      console.log('Loading Bible data from CSV...');
      
      let csvText = '';
      
      // Load from local file
      try {
        const response = await fetch('/genesis_bible_verses.csv');
        if (response.ok) {
          csvText = await response.text();
          console.log('Successfully loaded Bible data from local CSV file');
        } else {
          throw new Error('Local CSV file not found');
        }
      } catch (localError) {
        console.log('Could not load local CSV file, using fallback data...');
        csvText = this.getFallbackCSVData();
      }

      this.parseCSVText(csvText);
      this._dataLoaded = true;
      console.log(`Bible data loaded successfully. Parsed ${this.verses.size} chapters.`);
      
    } catch (error) {
      console.error('Error loading Bible data:', error);
      // Load fallback data on error
      this.parseCSVText(this.getFallbackCSVData());
      this._dataLoaded = true;
    }
  }

  private getFallbackCSVData(): string {
    // Fallback CSV data with ASV verses to match the Excel spreadsheet
    return `book,chapter,verse,text
Genesis,1,1,"In the beginning God created the heavens and the earth."
Genesis,1,2,"And the earth was waste and void; and darkness was upon the face of the deep: and the Spirit of God moved upon the face of the waters."
Genesis,1,3,"And God said, Let there be light: and there was light."
Genesis,1,4,"And God saw the light, that it was good: and God divided the light from the darkness."
Genesis,1,5,"And God called the light Day, and the darkness he called Night. And there was evening and there was morning, one day."
Genesis,1,26,"And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the birds of the heavens, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth."
Genesis,1,27,"And God created man in his own image, in the image of God created he him; male and female created he them."
Genesis,1,28,"And God blessed them: and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it; and have dominion over the fish of the sea, and over the birds of the heavens, and over every living thing that moveth upon the earth."
Genesis,2,7,"And Jehovah God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul."
Genesis,2,15,"And Jehovah God took the man, and put him into the garden of Eden to dress it and to keep it."
Genesis,2,18,"And Jehovah God said, It is not good that the man should be alone; I will make him a help meet for him."
Genesis,3,1,"Now the serpent was more subtle than any beast of the field which Jehovah God had made. And he said unto the woman, Yea, hath God said, Ye shall not eat of any tree of the garden?"
Genesis,3,6,"And when the woman saw that the tree was good for food, and that it was a delight to the eyes, and that the tree was to be desired to make one wise, she took of the fruit thereof, and did eat; and she gave also unto her husband with her, and he did eat."
Genesis,3,15,"and I will put enmity between thee and the woman, and between thy seed and her seed: he shall bruise thy head, and thou shalt bruise his heel."
Psalms,23,1,"Jehovah is my shepherd; I shall not want."
Psalms,23,2,"He maketh me to lie down in green pastures; He leadeth me beside still waters."
Psalms,23,3,"He restoreth my soul: He guideth me in the paths of righteousness for his name's sake."
Psalms,23,4,"Yea, though I walk through the valley of the shadow of death, I will fear no evil; for thou art with me; Thy rod and thy staff, they comfort me."
John,3,16,"For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life."
John,14,6,"Jesus saith unto him, I am the way, and the truth, and the life: no one cometh unto the Father, but by me."
Romans,3,23,"for all have sinned, and fall short of the glory of God;"
Romans,6,23,"For the wages of sin is death; but the free gift of God is eternal life in Christ Jesus our Lord."
Ephesians,2,8,"for by grace have ye been saved through faith; and that not of yourselves, it is the gift of God;"
Ephesians,2,9,"not of works, that no man should glory."`;
  }

  private parseCSVText(csvText: string): void {
    const lines = csvText.split('\n').filter(line => line.trim());
    let parsedCount = 0;
    
    // Check if first line is a header
    const firstLine = lines[0];
    const hasHeader = firstLine && (
      firstLine.toLowerCase().includes('book') || 
      firstLine.toLowerCase().includes('chapter') || 
      firstLine.toLowerCase().includes('verse') ||
      firstLine.toLowerCase().includes('text')
    );
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    console.log(`Processing ${dataLines.length} CSV lines (header detected: ${hasHeader})`);
    
    for (const line of dataLines) {
      const parsed = this.parseCSVLine(line);
      if (parsed) {
        const key = `${parsed.book}_${parsed.chapter}`;
        if (!this.verses.has(key)) {
          this.verses.set(key, []);
        }
        this.verses.get(key)!.push(parsed);
        parsedCount++;
      }
    }
    
    console.log(`Parsed ${parsedCount} verses from ${dataLines.length} lines`);
    console.log(`Available books:`, Array.from(this.verses.keys()).slice(0, 10).join(', ') + '...');
  }

  private parseCSVLine(line: string): CSVVerse | null {
    try {
      // Simple CSV parsing - handles quoted fields
      const fields = this.parseCSVFields(line);
      
      if (fields.length < 4) {
        return null;
      }

      const [book, chapterStr, verseStr, text] = fields;
      const chapter = parseInt(chapterStr);
      const verse = parseInt(verseStr);

      if (isNaN(chapter) || isNaN(verse)) {
        return null;
      }

      return {
        book: book.trim(),
        chapter,
        verse,
        text: text.trim()
      };
    } catch (error) {
      console.warn('Error parsing CSV line:', line, error);
      return null;
    }
  }

  private parseCSVFields(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    fields.push(current);
    
    return fields;
  }

  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    await this.loadBibleData();

    const key = `${book}_${chapter}`;
    const chapterVerses = this.verses.get(key);

    if (!chapterVerses) {
      console.warn(`No verses found for ${book} ${chapter}`);
      return null;
    }

    // Parse verse range (e.g., "1-5", "3", "1-3,5-7")
    const verseNumbers = this.parseVerseRange(verses);
    const matchingVerses = chapterVerses.filter(v => 
      verseNumbers.includes(v.verse)
    );

    if (matchingVerses.length === 0) {
      return null;
    }

    return {
      book,
      chapter,
      verses,
      text: matchingVerses.map(v => ({
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text
      }))
    };
  }

  private parseVerseRange(verses: string): number[] {
    const result: number[] = [];
    const parts = verses.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            result.push(i);
          }
        }
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num)) {
          result.push(num);
        }
      }
    }

    return result.sort((a, b) => a - b);
  }

  async searchVerses(query: string, limit: number = 20): Promise<BibleVerse[]> {
    await this.loadBibleData();

    const results: BibleVerse[] = [];
    const searchTerm = query.toLowerCase();

    for (const [, chapterVerses] of this.verses) {
      for (const verse of chapterVerses) {
        if (verse.text.toLowerCase().includes(searchTerm)) {
          results.push({
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text
          });

          if (results.length >= limit) {
            return results;
          }
        }
      }
    }

    return results;
  }

  async getStats(): Promise<{totalVerses: number, totalBooks: number, totalChapters: number}> {
    await this.loadBibleData();

    let totalVerses = 0;
    const uniqueBooks = new Set<string>();
    const uniqueChapters = new Set<string>();

    for (const [key, chapterVerses] of this.verses) {
      totalVerses += chapterVerses.length;
      
      for (const verse of chapterVerses) {
        uniqueBooks.add(verse.book);
        uniqueChapters.add(`${verse.book}_${verse.chapter}`);
      }
    }

    return {
      totalVerses,
      totalBooks: uniqueBooks.size,
      totalChapters: uniqueChapters.size
    };
  }

  isLoaded(): boolean {
    return this._dataLoaded;
  }
}

export const csvBibleService = new CSVBibleService();