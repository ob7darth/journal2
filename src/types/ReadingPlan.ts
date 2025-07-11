export interface Passage {
  book: string;
  chapter: number;
  verses: string;
  endChapter?: number; // Add optional end chapter for ranges
  displayText?: string; // Add optional custom display text
}

export interface DailyReading {
  day: number;
  date: string;
  passages: Passage[];
  theme: string;
}

export interface ReadingPlan {
  name: string;
  days: DailyReading[];
}