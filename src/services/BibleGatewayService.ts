import { BibleVerse, BiblePassage } from './BibleService';

class BibleGatewayService {
  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    try {
      // Since we can't directly fetch from Bible Gateway due to CORS,
      // we'll return a structured response that directs users to Bible Gateway
      const passageRef = verses ? `${book} ${chapter}:${verses}` : `${book} ${chapter}`;
      
      // Create a mock response that includes the reference and a link
      return {
        book,
        chapter,
        verses,
        text: [{
          book,
          chapter,
          verse: 1,
          text: `Please visit Bible Gateway to read ${passageRef}. Click the external link to view this passage.`
        }]
      };
    } catch (error) {
      console.error('Error fetching from Bible Gateway:', error);
      return null;
    }
  }

  async searchVerses(_query: string, _limit: number = 20): Promise<BibleVerse[]> {
    // Bible Gateway doesn't provide a direct search API that we can use from the browser
    // Return empty array and direct users to Bible Gateway for search
    return [];
  }

  getBibleGatewayUrl(book: string, chapter: number, verses: string, version: string = 'NASB'): string {
    const passage = `${book} ${chapter}`;
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${version}`;
  }

  getBibleGatewaySearchUrl(query: string, version: string = 'NASB'): string {
    return `https://www.biblegateway.com/quicksearch/?search=${encodeURIComponent(query)}&version=${version}`;
  }
}

export const bibleGatewayService = new BibleGatewayService();