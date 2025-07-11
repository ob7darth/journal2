import { BibleVerse, BiblePassage } from './BibleService';

class BibleGatewayService {
  async getPassage(book: string, chapter: number, verses: string): Promise<BiblePassage | null> {
    try {
      // For now, we'll use a simple approach that constructs Bible Gateway URLs
      // In a production app, you might want to use an actual Bible API
      
      // Since we can't directly fetch from Bible Gateway due to CORS,
      // we'll return a structured response that directs users to Bible Gateway
      const passageRef = `${book} ${chapter}:${verses}`;
      
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

  async searchVerses(limit: number = 20): Promise<BibleVerse[]> {
    // Bible Gateway doesn't provide a direct search API that we can use from the browser
    // Return empty array and direct users to Bible Gateway for search
    return [];
  }

  getBibleGatewayUrl(book: string, chapter: number, verses: string, version: string = 'ASV'): string {
    const passage = `${book} ${chapter}:${verses}`;
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${version}`;
  }

  getBibleGatewaySearchUrl(query: string, version: string = 'ASV'): string {
    return `https://www.biblegateway.com/quicksearch/?search=${encodeURIComponent(query)}&version=${version}`;
  }
}

export const bibleGatewayService = new BibleGatewayService();