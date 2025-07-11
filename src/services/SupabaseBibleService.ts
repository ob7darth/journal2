import { supabase, canUseSupabase } from '../lib/supabase';
import { BibleVerse, BiblePassage } from './BibleService';

interface JSONBibleData {
  books: {
    [bookName: string]: {
      chapters: {
        [chapterNumber: string]: {
          verses: {
            [verseNumber: string]: string;
          };
        };
      };
    };
  };
}

class SupabaseBibleService {
  private bibleData: JSONBibleData | null = null;
  private _dataLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private bucketName = 'bible';
  private fileName = 'bibles.xlsx'; // Excel file with multiple Bible versions

  constructor() {
    // Auto-load on instantiation
    this.loadBibleData();
  }

  // Allow configuration of bucket and file names
  configure(bucketName: string, fileName: string) {
    this.bucketName = bucketName;
    this.fileName = fileName;
    // Reset and reload with new configuration
    this.bibleData = null;
    this._dataLoaded = false;
    this.loadingPromise = null;
    this.loadBibleData();
  }

  private async loadBibleData(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.fetchAndParseJSONData();
    return this.loadingPromise;
  }

  private async fetchAndParseJSONData(): Promise<void> {
    if (!canUseSupabase() || !supabase) {
      console.log('Supabase not configured, skipping JSON Bible data load');
      this._dataLoaded = true;
      return;
    }

    try {
      console.log(`Attempting to load ASV Bible data from Excel: ${this.bucketName}/${this.fileName}`);
      
      // Download the Excel file from Supabase storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(this.fileName);

      if (error) {
        console.error('❌ Could not download Bible Excel from Supabase storage:', error.message);
        console.error(`📁 Storage bucket '${this.bucketName}' or Excel file '${this.fileName}' not found.`);
        console.error('🔗 Expected URL:', `${supabase.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${this.fileName}`);
        this._dataLoaded = true;
        return;
      }

      if (!data) {
        console.error('❌ No Excel data received from Supabase storage');
        this._dataLoaded = true;
        return;
      }

      // Parse Excel file and extract ASV column
      const bibleData = await this.parseExcelToJSON(data);
      if (!bibleData) {
        console.error('❌ Failed to parse Excel file');
        this._dataLoaded = true;
        return;
      }
      
      this.bibleData = bibleData;
      
      this._dataLoaded = true;
      
      const bookCount = Object.keys(this.bibleData?.books || {}).length;
      console.log(`✅ ASV Bible data loaded successfully from Excel file`);
      console.log(`📚 Available books (${bookCount}):`, Object.keys(this.bibleData?.books || {}).slice(0, 10).join(', ') + (bookCount > 10 ? '...' : ''));
      
    } catch (error) {
      console.error('❌ Could not load ASV Bible data from Excel file:', error instanceof Error ? error.message : 'Unknown error');
      this._dataLoaded = true; // Mark as loaded even on error to prevent infinite retries
      
      // You might want to show a user-friendly error message here
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          console.error(`📄 Bible Excel file not found at ${this.bucketName}/${this.fileName}. Please upload your Excel file to this location.`);
        } else if (error.message.includes('permission')) {
          console.error('🔒 Permission denied accessing Bible Excel file. Check your RLS policies.');
        }
      }
    }
  }

  private async parseExcelToJSON(excelBlob: Blob): Promise<JSONBibleData | null> {
    try {
      // For now, we'll assume the Excel file has been converted to CSV format
      // In a production environment, you might want to use a library like xlsx
      console.log('📊 Parsing Excel file for ASV Bible data...');
      
      // Convert blob to text (assuming CSV format for now)
      const csvText = await excelBlob.text();
      
      // Parse CSV and extract ASV column
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        console.error('❌ Empty Excel/CSV file');
        return null;
      }
      
      // Find header row and ASV column index
      const headers = this.parseCSVLine(lines[0]);
      let asvIndex = headers.findIndex(header => 
        header.toLowerCase().trim().includes('asv')
      );
      
      // If ASV column not found, try 'text' column
      if (asvIndex === -1) {
        asvIndex = headers.findIndex(header => 
          header.toLowerCase().trim().includes('text')
        );
      }
      
      // If neither ASV nor text column found, use the last column
      if (asvIndex === -1) {
        asvIndex = headers.length - 1;
        console.log(`⚠️ ASV/text column not found by name, using last column (index ${asvIndex}) as fallback`);
      }
      
      // Verify the index is within bounds
      if (asvIndex >= headers.length || asvIndex < 0) {
        console.error('❌ Bible text column index is out of bounds');
        console.log('📋 Available columns:', headers);
        return null;
      }
      
      console.log(`✅ Using Bible text column at index ${asvIndex} (${headers[asvIndex]})`);
      
      // Assume first column (index 0) contains the Bible reference (e.g., "Genesis 1:1")
      const referenceIndex = 0;
      
      if (referenceIndex >= headers.length) {
        console.error('❌ Reference column not found');
        console.log('📋 Available columns:', headers);
        return null;
      }
      
      console.log(`✅ Using reference column at index ${referenceIndex} (${headers[referenceIndex]})`);
      
      // Parse data rows
      const books: any = {};
      let processedVerses = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCSVLine(lines[i]);
        if (fields.length <= Math.max(bookIndex, chapterIndex, verseIndex, asvIndex)) {
          continue;
        }
        
        const reference = fields[referenceIndex]?.trim();
        const asvText = fields[asvIndex]?.trim();
        
        if (!reference || !asvText) {
          continue;
        }
        
        // Parse the reference string (e.g., "Genesis 1:1")
        const parsedRef = this.parseReference(reference);
        if (!parsedRef) {
          continue;
        }
        
        const { book: bookName, chapter: chapterNum, verse: verseNum } = parsedRef;
        
        // Initialize book structure
        if (!books[bookName]) {
          books[bookName] = { chapters: {} };
        }
        
        // Initialize chapter structure
        if (!books[bookName].chapters[chapterNum]) {
          books[bookName].chapters[chapterNum] = { verses: {} };
        }
        
        // Add verse
        books[bookName].chapters[chapterNum].verses[verseNum] = asvText;
        processedVerses++;
      }
      
      console.log(`✅ Processed ${processedVerses} ASV verses from Excel file`);
      console.log(`📚 Books found: ${Object.keys(books).length}`);
      
      return { books };
      
    } catch (error) {
      console.error('❌ Error parsing Excel file:', error);
      return null;
    }
  }

  private parseReference(reference: string): { book: string; chapter: number; verse: number } | null {
    // Parse references like "Genesis 1:1", "1 Kings 2:3", "Psalm 23:1", etc.
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    
    if (!match) {
      console.warn(`❌ Could not parse reference: ${reference}`);
      return null;
    }
    
    const [, book, chapterStr, verseStr] = match;
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStr);
    
    if (isNaN(chapter) || isNaN(verse)) {
      console.warn(`❌ Invalid chapter/verse numbers in: ${reference}`);
      return null;
    }
    
    return {
      book: book.trim(),
      chapter,
      verse
    };
  }

  private parseCSVLine(line: string): string[] {
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

    if (!this.bibleData) {
      console.warn('❌ Bible JSON data not available - data failed to load or is invalid');
      return null;
    }

    if (!this.bibleData.books) {
      console.error('❌ Bible JSON data has no books property');
      return null;
    }

    console.log('📚 Available books in JSON:', Object.keys(this.bibleData.books).slice(0, 10).join(', ') + '...');
    console.log('🔍 Looking for book:', book);

    // Normalize book name (handle different formats)
    const normalizedBook = this.normalizeBookName(book);
    console.log('📖 Normalized book name:', normalizedBook);
    
    const bookData = this.bibleData.books[normalizedBook];

    if (!bookData) {
      console.warn(`❌ Book not found in JSON data: ${book} (normalized: ${normalizedBook})`);
      console.log('📚 Available books:', Object.keys(this.bibleData.books));
      return null;
    }

    if (!bookData.chapters) {
      console.error(`❌ Book ${normalizedBook} has no chapters property`);
      return null;
    }

    const chapterData = bookData.chapters[chapter.toString()];
    if (!chapterData) {
      console.warn(`❌ Chapter not found: ${book} ${chapter}`);
      console.log('📑 Available chapters for', normalizedBook, ':', Object.keys(bookData.chapters));
      return null;
    }

    if (!chapterData.verses) {
      console.error(`❌ Chapter ${chapter} has no verses property`);
      return null;
    }

    // Parse verse range (e.g., "1-5", "3", "1-3,5-7")
    const verseNumbers = this.parseVerseRange(verses);
    const matchingVerses: BibleVerse[] = [];

    for (const verseNum of verseNumbers) {
      const verseText = chapterData.verses[verseNum.toString()];
      if (verseText) {
        matchingVerses.push({
          book: normalizedBook,
          chapter,
          verse: verseNum,
          text: verseText
        });
      }
    }

    if (matchingVerses.length === 0) {
      console.warn(`❌ No verses found for ${book} ${chapter}:${verses}`);
      console.log('📝 Available verses for chapter:', Object.keys(chapterData.verses));
      return null;
    }

    console.log(`✅ Found ${matchingVerses.length} verses for ${book} ${chapter}:${verses}`);
    return {
      book: normalizedBook,
      chapter,
      verses,
      text: matchingVerses
    };
  }

  async searchVerses(query: string, limit: number = 20): Promise<BibleVerse[]> {
    await this.loadBibleData();

    if (!this.bibleData) {
      return [];
    }

    const results: BibleVerse[] = [];
    const searchTerm = query.toLowerCase();

    for (const [bookName, bookData] of Object.entries(this.bibleData.books)) {
      for (const [chapterNum, chapterData] of Object.entries(bookData.chapters)) {
        for (const [verseNum, verseText] of Object.entries(chapterData.verses)) {
          if (verseText.toLowerCase().includes(searchTerm)) {
            results.push({
              book: bookName,
              chapter: parseInt(chapterNum),
              verse: parseInt(verseNum),
              text: verseText
            });

            if (results.length >= limit) {
              return results;
            }
          }
        }
      }
    }

    return results;
  }

  async getStats(): Promise<{totalVerses: number, totalBooks: number, totalChapters: number}> {
    await this.loadBibleData();

    if (!this.bibleData) {
      return {
        totalVerses: 0,
        totalBooks: 0,
        totalChapters: 0
      };
    }

    let totalVerses = 0;
    let totalChapters = 0;
    const totalBooks = Object.keys(this.bibleData.books).length;

    for (const bookData of Object.values(this.bibleData.books)) {
      const chapters = Object.keys(bookData.chapters);
      totalChapters += chapters.length;
      
      for (const chapterData of Object.values(bookData.chapters)) {
        totalVerses += Object.keys(chapterData.verses).length;
      }
    }

    return {
      totalVerses,
      totalBooks,
      totalChapters
    };
  }

  isLoaded(): boolean {
    return this._dataLoaded;
  }

  hasData(): boolean {
    return this.bibleData !== null;
  }

  getAvailableBooks(): string[] {
    if (!this.bibleData) {
      return [];
    }
    return Object.keys(this.bibleData.books);
  }

  private normalizeBookName(book: string): string {
    // Handle common book name variations
    const bookMappings: Record<string, string> = {
      'Genesis': 'Genesis',
      'Gen': 'Genesis',
      'Gen.': 'Genesis',
      'Exodus': 'Exodus',
      'Ex': 'Exodus',
      'Ex.': 'Exodus',
      'Leviticus': 'Leviticus',
      'Lev': 'Leviticus',
      'Lev.': 'Leviticus',
      'Numbers': 'Numbers',
      'Num': 'Numbers',
      'Num.': 'Numbers',
      'Deuteronomy': 'Deuteronomy',
      'Deut': 'Deuteronomy',
      'Deut.': 'Deuteronomy',
      'Joshua': 'Joshua',
      'Josh': 'Joshua',
      'Josh.': 'Joshua',
      'Judges': 'Judges',
      'Judg': 'Judges',
      'Judg.': 'Judges',
      'Ruth': 'Ruth',
      '1 Samuel': '1 Samuel',
      '1Sam': '1 Samuel',
      '1 Sam': '1 Samuel',
      '1 Sam.': '1 Samuel',
      '2 Samuel': '2 Samuel',
      '2Sam': '2 Samuel',
      '2 Sam': '2 Samuel',
      '2 Sam.': '2 Samuel',
      '1 Kings': '1 Kings',
      '1Ki': '1 Kings',
      '1 Ki': '1 Kings',
      '1 Ki.': '1 Kings',
      '2 Kings': '2 Kings',
      '2Ki': '2 Kings',
      '2 Ki': '2 Kings',
      '2 Ki.': '2 Kings',
      '1 Chronicles': '1 Chronicles',
      '1Chr': '1 Chronicles',
      '1 Chr': '1 Chronicles',
      '1 Chr.': '1 Chronicles',
      '2 Chronicles': '2 Chronicles',
      '2Chr': '2 Chronicles',
      '2 Chr': '2 Chronicles',
      '2 Chr.': '2 Chronicles',
      'Ezra': 'Ezra',
      'Nehemiah': 'Nehemiah',
      'Neh': 'Nehemiah',
      'Neh.': 'Nehemiah',
      'Esther': 'Esther',
      'Est': 'Esther',
      'Est.': 'Esther',
      'Job': 'Job',
      'Psalms': 'Psalms',
      'Ps': 'Psalms',
      'Ps.': 'Psalms',
      'Psalm': 'Psalms',
      'Proverbs': 'Proverbs',
      'Prov': 'Proverbs',
      'Prov.': 'Proverbs',
      'Ecclesiastes': 'Ecclesiastes',
      'Ecc': 'Ecclesiastes',
      'Ecc.': 'Ecclesiastes',
      'Song of Songs': 'Song of Songs',
      'Song': 'Song of Songs',
      'Isaiah': 'Isaiah',
      'Is': 'Isaiah',
      'Is.': 'Isaiah',
      'Jeremiah': 'Jeremiah',
      'Jer': 'Jeremiah',
      'Jer.': 'Jeremiah',
      'Lamentations': 'Lamentations',
      'Lam': 'Lamentations',
      'Lam.': 'Lamentations',
      'Ezekiel': 'Ezekiel',
      'Ezek': 'Ezekiel',
      'Ezek.': 'Ezekiel',
      'Daniel': 'Daniel',
      'Dan': 'Daniel',
      'Dan.': 'Daniel',
      'Hosea': 'Hosea',
      'Hos': 'Hosea',
      'Hos.': 'Hosea',
      'Joel': 'Joel',
      'Amos': 'Amos',
      'Obadiah': 'Obadiah',
      'Obad': 'Obadiah',
      'Obad.': 'Obadiah',
      'Jonah': 'Jonah',
      'Jon': 'Jonah',
      'Jon.': 'Jonah',
      'Micah': 'Micah',
      'Mic': 'Micah',
      'Mic.': 'Micah',
      'Nahum': 'Nahum',
      'Nah': 'Nahum',
      'Nah.': 'Nahum',
      'Habakkuk': 'Habakkuk',
      'Hab': 'Habakkuk',
      'Hab.': 'Habakkuk',
      'Zephaniah': 'Zephaniah',
      'Zeph': 'Zephaniah',
      'Zeph.': 'Zephaniah',
      'Haggai': 'Haggai',
      'Hag': 'Haggai',
      'Hag.': 'Haggai',
      'Zechariah': 'Zechariah',
      'Zech': 'Zechariah',
      'Zech.': 'Zechariah',
      'Malachi': 'Malachi',
      'Mal': 'Malachi',
      'Mal.': 'Malachi',
      'Matthew': 'Matthew',
      'Matt': 'Matthew',
      'Mt': 'Matthew',
      'Mt.': 'Matthew',
      'Mark': 'Mark',
      'Mk': 'Mark',
      'Mk.': 'Mark',
      'Luke': 'Luke',
      'Lk': 'Luke',
      'Lk.': 'Luke',
      'John': 'John',
      'Jn': 'John',
      'Jn.': 'John',
      'Acts': 'Acts',
      'Romans': 'Romans',
      'Rom': 'Romans',
      'Rom.': 'Romans',
      '1 Corinthians': '1 Corinthians',
      '1Cor': '1 Corinthians',
      '1 Cor': '1 Corinthians',
      '1 Cor.': '1 Corinthians',
      '2 Corinthians': '2 Corinthians',
      '2Cor': '2 Corinthians',
      '2 Cor': '2 Corinthians',
      '2 Cor.': '2 Corinthians',
      'Galatians': 'Galatians',
      'Gal': 'Galatians',
      'Gal.': 'Galatians',
      'Ephesians': 'Ephesians',
      'Eph': 'Ephesians',
      'Eph.': 'Ephesians',
      'Philippians': 'Philippians',
      'Phil': 'Philippians',
      'Phil.': 'Philippians',
      'Colossians': 'Colossians',
      'Col': 'Colossians',
      'Col.': 'Colossians',
      '1 Thessalonians': '1 Thessalonians',
      '1Th': '1 Thessalonians',
      '1 Th': '1 Thessalonians',
      '1 Th.': '1 Thessalonians',
      '2 Thessalonians': '2 Thessalonians',
      '2Th': '2 Thessalonians',
      '2 Th': '2 Thessalonians',
      '2 Th.': '2 Thessalonians',
      '1 Timothy': '1 Timothy',
      '1Tim': '1 Timothy',
      '1 Tim': '1 Timothy',
      '1 Tim.': '1 Timothy',
      '2 Timothy': '2 Timothy',
      '2Tim': '2 Timothy',
      '2 Tim': '2 Timothy',
      '2 Tim.': '2 Timothy',
      'Titus': 'Titus',
      'Tit': 'Titus',
      'Tit.': 'Titus',
      'Philemon': 'Philemon',
      'Philem': 'Philemon',
      'Philem.': 'Philemon',
      'Hebrews': 'Hebrews',
      'Heb': 'Hebrews',
      'Heb.': 'Hebrews',
      'James': 'James',
      'Jas': 'James',
      'Jas.': 'James',
      '1 Peter': '1 Peter',
      '1Pet': '1 Peter',
      '1 Pet': '1 Peter',
      '1 Pet.': '1 Peter',
      '2 Peter': '2 Peter',
      '2Pet': '2 Peter',
      '2 Pet': '2 Peter',
      '2 Pet.': '2 Peter',
      '1 John': '1 John',
      '1Jn': '1 John',
      '1 Jn': '1 John',
      '1 Jn.': '1 John',
      '2 John': '2 John',
      '2Jn': '2 John',
      '2 Jn': '2 John',
      '2 Jn.': '2 John',
      '3 John': '3 John',
      '3Jn': '3 John',
      '3 Jn': '3 John',
      '3 Jn.': '3 John',
      'Jude': 'Jude',
      'Revelation': 'Revelation',
      'Rev': 'Revelation',
      'Rev.': 'Revelation'
    };

    // First try exact match
    if (bookMappings[book]) {
      return bookMappings[book];
    }
    
    // If no exact match, try to find a case-insensitive match in the actual data
    if (this.bibleData) {
      const availableBooks = Object.keys(this.bibleData.books);
      const lowerBook = book.toLowerCase();
      
      for (const availableBook of availableBooks) {
        if (availableBook.toLowerCase() === lowerBook) {
          return availableBook;
        }
      }
      
      // Try partial matches for common abbreviations
      for (const availableBook of availableBooks) {
        if (availableBook.toLowerCase().startsWith(lowerBook)) {
          return availableBook;
        }
      }
    }
    
    return book;
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
}

export const supabaseBibleService = new SupabaseBibleService();