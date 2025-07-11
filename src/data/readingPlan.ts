import { ReadingPlan, Passage } from '../types/ReadingPlan';

// Helper function to parse passage strings like "Gen. 1-2" or "Ps. 3"
const parsePassages = (passageStr: string): Passage[] => {
  const passages: Passage[] = [];
  const parts = passageStr.split(';').map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('Ps.')) {
      // Handle Psalms
      const psalmMatch = part.match(/Ps\.\s*(\d+(?:-\d+)?(?:,\d+)*)/);
      if (psalmMatch) {
        const psalmRange = psalmMatch[1];
        if (psalmRange.includes(',')) {
          // Handle comma-separated psalms like "39,41"
          const psalms = psalmRange.split(',').map(p => parseInt(p.trim()));
          for (const psalm of psalms) {
            passages.push({
              book: "Psalms",
              chapter: psalm,
              verses: "1-176",
              displayText: `Psalms ${psalm}`
            });
          }
        } else if (psalmRange.includes('-')) {
          const [start, end] = psalmRange.split('-').map(n => parseInt(n));
          passages.push({
            book: "Psalms",
            chapter: start,
            verses: "1-176",
            endChapter: end,
            displayText: `Psalms ${start}-${end}`
          });
        } else {
          passages.push({
            book: "Psalms",
            chapter: parseInt(psalmRange),
            verses: "1-176",
            displayText: `Psalms ${psalmRange}`
          });
        }
      }
    } else if (part.includes('119:')) {
      // Handle Psalm 119 with verse ranges
      const psalm119Match = part.match(/119:\s*(\d+)-(\d+)/);
      if (psalm119Match) {
        const startVerse = psalm119Match[1];
        const endVerse = psalm119Match[2];
        passages.push({
          book: "Psalms",
          chapter: 119,
          verses: `${startVerse}-${endVerse}`,
          displayText: `Psalms 119:${startVerse}-${endVerse}`
        });
      }
    } else {
      // Handle other books
      const bookMatch = part.match(/^([A-Za-z0-9\s]+\.?)\s*(.*)$/);
      if (bookMatch) {
        const bookAbbrev = bookMatch[1].trim();
        const chapterPart = bookMatch[2].trim();
        
        // Map abbreviations to full book names
        const bookMap: Record<string, string> = {
          'Gen.': 'Genesis',
          'Ex.': 'Exodus',
          'Lev.': 'Leviticus',
          'Num.': 'Numbers',
          'Deut.': 'Deuteronomy',
          'Josh.': 'Joshua',
          'Judg.': 'Judges',
          'Ruth': 'Ruth',
          '1 Sam.': '1 Samuel',
          '2 Sam.': '2 Samuel',
          '1 Ki.': '1 Kings',
          '2 Ki.': '2 Kings',
          '1 Chr.': '1 Chronicles',
          '2 Chr.': '2 Chronicles',
          'Prov.': 'Proverbs',
          'Ecc.': 'Ecclesiastes',
          'Song': 'Song of Songs',
          'Is.': 'Isaiah',
          'Joel': 'Joel',
          'Jon.': 'Jonah',
          'Amos': 'Amos',
          'Hos.': 'Hosea',
          'Mic.': 'Micah',
          'Nah.': 'Nahum',
          'Hab.': 'Habakkuk',
          'Zeph.': 'Zephaniah',
          'Jer.': 'Jeremiah',
          'Ezek.': 'Ezekiel',
          'Lam.': 'Lamentations',
          'Obad': 'Obadiah',
          'Dan.': 'Daniel',
          'Ezra': 'Ezra',
          'Hag.': 'Haggai',
          'Zech.': 'Zechariah',
          'Luke': 'Luke',
          'Lk.': 'Luke',
          'Acts': 'Acts',
          'Mark': 'Mark',
          'Mk.': 'Mark',
          'Mt.': 'Matthew',
          'Jn.': 'John',
          'Gal.': 'Galatians',
          '1 Cor.': '1 Corinthians',
          '2 Cor.': '2 Corinthians',
          '1 Th.': '1 Thessalonians',
          '2 Th.': '2 Thessalonians',
          'Rom.': 'Romans',
          'Eph.': 'Ephesians',
          'Phil.': 'Philippians',
          'Col.': 'Colossians',
          '1 Tim.': '1 Timothy',
          '2 Tim.': '2 Timothy',
          'Titus': 'Titus',
          'Tit.': 'Titus',
          'Philem.': 'Philemon',
          'Heb.': 'Hebrews',
          'Jas.': 'James',
          '1 Pet.': '1 Peter',
          '2 Pet.': '2 Peter',
          'Jude': 'Jude',
          '1 Jn.': '1 John',
          '2 Jn.': '2 John',
          '3 Jn.': '3 John',
          'Rev.': 'Revelation',
          'Neh.': 'Nehemiah',
          'Est.': 'Esther',
          'Mal.': 'Malachi',
          'Job': 'Job'
        };
        
        const fullBookName = bookMap[bookAbbrev] || bookAbbrev;
        
        // Handle single-chapter books (no chapter numbers)
        const singleChapterBooks = ['Obadiah', 'Philemon', 'Jude', '2 John', '3 John'];
        
        if (singleChapterBooks.includes(fullBookName)) {
          passages.push({
            book: fullBookName,
            chapter: 1,
            verses: "1-25",
            displayText: fullBookName
          });
        } else if (!chapterPart) {
          // If no chapter part is provided, it might be a single-chapter book
          if (singleChapterBooks.includes(fullBookName)) {
            passages.push({
              book: fullBookName,
              chapter: 1,
              verses: "1-25",
              displayText: fullBookName
            });
          }
        } else {
          // Handle chapter ranges like "1-2" or "3-5" or "6,7"
          if (chapterPart.includes('-')) {
            const [start, end] = chapterPart.split('-').map(c => parseInt(c.trim()));
            passages.push({
              book: fullBookName,
              chapter: start,
              verses: "1-50",
              endChapter: end,
              displayText: `${fullBookName} ${start}-${end}`
            });
          } else if (chapterPart.includes(',')) {
            // Handle comma-separated chapters like "1,2"
            const chapters = chapterPart.split(',').map(c => parseInt(c.trim()));
            
            // Group consecutive chapters
            const groups = groupConsecutiveChapters(chapters);
            for (const group of groups) {
              if (group.length === 1) {
                passages.push({
                  book: fullBookName,
                  chapter: group[0],
                  verses: "1-50",
                  displayText: `${fullBookName} ${group[0]}`
                });
              } else {
                // Create a single passage for consecutive chapters
                passages.push({
                  book: fullBookName,
                  chapter: group[0],
                  verses: "1-50",
                  endChapter: group[group.length - 1],
                  displayText: `${fullBookName} ${group[0]}-${group[group.length - 1]}`
                });
              }
            }
          } else {
            passages.push({
              book: fullBookName,
              chapter: parseInt(chapterPart),
              verses: "1-50",
              displayText: `${fullBookName} ${chapterPart}`
            });
          }
        }
      }
    }
  }
  
  return passages;
};

// Helper function to group consecutive chapter numbers
function groupConsecutiveChapters(chapters: number[]): number[][] {
  if (chapters.length === 0) return [];
  
  chapters.sort((a, b) => a - b);
  const groups: number[][] = [];
  let currentGroup = [chapters[0]];
  
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i] === chapters[i - 1] + 1) {
      // Consecutive chapter
      currentGroup.push(chapters[i]);
    } else {
      // Non-consecutive, start new group
      groups.push(currentGroup);
      currentGroup = [chapters[i]];
    }
  }
  
  groups.push(currentGroup);
  return groups;
}

// January readings from the uploaded plan
const januaryReadings = [
  "Gen. 1-2; Luke 1",
  "Gen. 3-5; Luke 2", 
  "Gen. 6-8; Luke 3",
  "Gen. 9-11; Luke 4",
  "Gen. 12-14; Luke 5",
  "Gen. 15-17; Luke 6",
  "Gen. 18-19; Ps. 3; Luke 7",
  "Gen. 20-22; Luke 8",
  "Gen. 23-24; Luke 9",
  "Gen. 25-26; Ps. 6; Luke 10",
  "Gen. 27-28; Ps. 4; Luke 11",
  "Gen. 29-30; Luke 12",
  "Gen. 31-33; Luke 13",
  "Gen. 34-36; Luke 14",
  "Gen. 37-38; Ps. 7; Luke 15",
  "Gen. 39-41; Luke 16",
  "Gen. 42-43; Ps. 5; Luke 17",
  "Gen. 44-46; Luke 18",
  "Gen. 47-48; Ps. 10; Luke 19",
  "Gen. 49-50; Ps. 8; Luke 20",
  "Ex. 1-2; Ps. 88; Luke 21",
  "Ex. 3-5; Luke 22",
  "Ex. 6-8; Luke 23",
  "Ex. 9-11; Luke 24",
  "Ex. 12-13; Ps. 21; Acts 1",
  "Ex. 14-16; Acts 2",
  "Ex. 17-20; Acts 3",
  "Ex. 21-22; Ps. 12; Acts 4",
  "Ex. 23-24; Ps. 14; Acts 5",
  "Ex. 25-27; Acts 6",
  "Ex. 28-29; Acts 7"
];

// February readings from the uploaded plan
const februaryReadings = [
  "Ex. 30-32; Acts 8",
  "Ex. 33-34; Ps. 16; Acts 9",
  "Ex. 35-36; Acts 10",
  "Ex. 37-38; Ps. 19; Acts 11",
  "Ex. 39-40; Ps. 15; Acts 12",
  "Lev. 1-3; Acts 13",
  "Lev. 4-6; Acts 14",
  "Lev. 7-9; Acts 15",
  "Lev. 10-12; Acts 16",
  "Lev. 13-14; Acts 17",
  "Lev. 15-17; Acts 18",
  "Lev. 18-19; Ps. 13; Acts 19",
  "Lev. 20-22; Acts 20",
  "Lev. 23-24; Ps. 24; Acts 21",
  "Lev. 25; Ps. 25-26; Acts 22",
  "Lev. 26-27; Acts 23",
  "Num. 1-2; Acts 24",
  "Num. 3-4; Acts 25",
  "Num. 5-6; Ps. 22; Acts 26",
  "Num. 7; Ps. 23; Acts 27",
  "Num. 8-9; Acts 28",
  "Num. 10-11; Ps. 27; Mark 1",
  "Num. 12-13; Ps. 90; Mark 2",
  "Num. 14-16; Mark 3",
  "Num. 17-18; Ps. 29; Mark 4",
  "Num. 19-20; Ps. 28; Mark 5",
  "Num. 21-23; Mark 6-7",
  "Num. 24-27; 1 Cor. 13"
];

// March readings from the uploaded plan
const marchReadings = [
  "Num. 28-29; Mark 8",
  "Num. 30-31; Mark 9",
  "Num. 32-33; Mark 10",
  "Num. 34-36; Mark 11",
  "Deut. 1-2; Mark 12",
  "Deut. 3-4; Ps. 36; Mark 13",
  "Deut. 5-6; Ps. 43; Mark 14",
  "Deut. 7-9; Mark 15",
  "Deut. 10-12; Mark 16",
  "Deut. 13-15; Gal. 1",
  "Deut. 16-18; Ps. 38; Gal. 2",
  "Deut. 19-21; Gal. 3",
  "Deut. 22-24; Gal. 4",
  "Deut. 25-27; Gal. 5",
  "Deut. 28-29; Gal. 6",
  "Deut. 30-31; Ps. 40; 1 Cor. 1",
  "Deut. 32-34; 1 Cor. 2",
  "Josh. 1-2; Ps. 37; 1 Cor. 3",
  "Josh. 3-6; 1 Cor. 4",
  "Josh. 7-8; Ps. 69; 1 Cor. 5",
  "Josh. 9-11; 1 Cor. 6",
  "Josh. 12-14; 1 Cor. 7",
  "Josh. 15-17; 1 Cor. 8",
  "Josh. 18-20; 1 Cor. 9",
  "Josh. 21-22; Ps. 47; 1 Cor. 10",
  "Josh. 23-24; Ps. 44; 1 Cor. 11",
  "Judg. 1-3; 1 Cor. 12",
  "Judg. 4-5; Ps. 39,41; 1 Cor. 13",
  "Judg. 6-7; Ps. 52; 1 Cor. 14",
  "Judg. 8; Ps. 42; 1 Cor. 15",
  "Judg. 9-10; Ps. 49; 1 Cor. 16"
];

// April readings from the uploaded plan
const aprilReadings = [
  "Judg. 11-12; Ps. 50; 2 Cor. 1",
  "Judg. 13-16; 2 Cor. 2",
  "Judg. 17-18; Ps. 89; 2 Cor. 3",
  "Judg. 19-21; 2 Cor. 4",
  "Ruth 1-2; Ps. 53,61; 2 Cor. 5",
  "Ruth 3-4; Ps. 64-65; 2 Cor. 6",
  "1 Sam. 1-2; Ps. 66; 2 Cor. 7",
  "1 Sam. 3-5; Ps. 77; 2 Cor. 8",
  "1 Sam. 6-7; Ps. 72; 2 Cor. 9",
  "1 Sam. 8-10; 2 Cor. 10",
  "1 Sam. 11-12; 1 Chr. 1; 2 Cor. 11",
  "1 Sam. 13; 1 Chr. 2-3; 2 Cor. 12",
  "1 Sam. 14; 1 Chr. 4; 2 Cor. 13",
  "1 Sam. 15-16; 1 Chr. 5; Mt. 1",
  "1 Sam. 17; Ps. 9; Mt. 2",
  "1 Sam. 18; 1 Chr. 6; Ps. 141; Mt. 3",
  "1 Sam. 19; 1 Chr. 7; Ps. 59; Mt. 4",
  "1 Sam. 20-21; Ps. 34; Mt. 5",
  "1 Sam. 22; Ps. 17,35; Mt. 6",
  "1 Sam. 23; Ps. 31,54; Mt. 7",
  "1 Sam. 24; Ps. 57-58; 1 Chr. 8; Mt. 8",
  "1 Sam. 25-26; Ps. 63; Mt. 9",
  "1 Sam. 27; Ps. 141; 1 Chr. 9; Mt. 10",
  "1 Sam. 28-29; Ps. 109; Mt. 11",
  "1 Sam. 30-31; 1 Chr. 10; Mt. 12",
  "2 Sam. 1; Ps. 140; Mt. 13",
  "2 Sam. 2; 1 Chr. 11; Ps. 142; Mt. 14",
  "2 Sam. 3; 1 Chr. 12; Mt. 15",
  "2 Sam. 4-5; Ps. 139; Mt. 16",
  "2 Sam. 6; 1 Chr. 13; Ps. 68; Mt. 17"
];

// May readings from the uploaded plan
const mayReadings = [
  "1 Chr. 14-15; Ps. 132; Mt. 18",
  "1 Chr. 16; Ps. 106; Mt. 19",
  "2 Sam. 7; 1 Chr. 17; Ps. 2; Mt. 20",
  "2 Sam. 8-9; 1 Chr. 18-19; Mt. 21",
  "2 Sam. 10; 1 Chr. 20; Ps. 20; Mt. 22",
  "2 Sam. 11-12; Ps. 51; Mt. 23",
  "2 Sam. 13-14; Mt. 24",
  "2 Sam. 15-16; Ps. 32; Mt. 25",
  "2 Sam. 17; Ps. 71; Mt. 26",
  "2 Sam. 18; Ps. 56; Mt. 27",
  "2 Sam. 19-20; Ps. 55; Mt. 28",
  "2 Sam. 21-23; 1 Th. 1",
  "2 Sam. 24; 1 Chr. 21; Ps. 30; 1 Th. 2",
  "1 Chr. 22-24; 1 Th. 3",
  "1 Chr. 25-27; 1 Th. 4",
  "1 Ki. 1; 1 Chr. 28; Ps. 91; 1 Th. 5",
  "1 Ki. 2; 1 Chr. 29; Ps. 95; 2 Th. 1",
  "1 Ki. 3; 2 Chr. 1; Ps. 78; 2 Th. 2",
  "1 Ki. 4-5; 2 Chr. 2; Ps. 101; 2 Th. 3",
  "1 Ki. 6; 2 Chr. 3; Ps. 97; Rom. 1",
  "1 Ki. 7; 2 Chr. 4; Ps. 98; Rom. 2",
  "1 Ki. 8; 2 Chr. 5; Ps. 99; Rom. 3",
  "2 Chr. 6-7; Ps. 135; Rom. 4",
  "1 Ki. 9; 2 Chr. 8; Ps. 136; Rom. 5",
  "1 Ki. 10-11; 2 Chr. 9; Rom. 6",
  "Prov. 1-3; Rom. 7",
  "Prov. 4-6; Rom. 8",
  "Prov. 7-9; Rom. 9",
  "Prov. 10-12; Rom. 10",
  "Prov. 13-15; Rom. 11",
  "Prov. 16-18; Rom. 12"
];

// June readings from the uploaded plan
const juneReadings = [
  "Prov. 19-21; Rom. 13",
  "Prov. 22-24; Rom. 14",
  "Prov. 25-27; Rom. 15",
  "Prov. 28-29; Ps. 60; Rom. 16",
  "Prov. 30-31; Ps. 33; Eph. 1",
  "Ecc. 1-3; Ps. 45; Eph. 2",
  "Ecc. 4-6; Ps. 18; Eph. 3",
  "Ecc. 7-9; Eph. 4",
  "Ecc. 10-12; Ps. 94; Eph. 5",
  "Song 1-4; Eph. 6",
  "Song 5-8; Phil. 1",
  "1 Ki. 12; 2 Chr. 10-11; Phil. 2",
  "1 Ki. 13-14; 2 Chr. 12; Phil. 3",
  "1 Ki. 15; 2 Chr. 13-14; Phil. 4",
  "1 Ki. 16; 2 Chr. 15-16; Col. 1",
  "1 Ki. 17-19; Col. 2",
  "1 Ki. 20-21; 2 Chr. 17; Col. 3",
  "1 Ki. 22; 2 Chr. 18-19; Col. 4",
  "2 Ki. 1-3; Ps. 82; 1 Tim. 1",
  "2 Ki. 4-5; Ps. 83; 1 Tim. 2",
  "2 Ki. 6-7; 2 Chr. 20; 1 Tim. 3",
  "2 Ki. 8-9; 2 Chr. 21; 1 Tim. 4",
  "2 Ki. 10; 2 Chr. 22-23; 1 Tim. 5",
  "2 Ki. 11-12; 2 Chr. 24; 1 Tim. 6",
  "Joel 1-3; 2 Tim. 1",
  "Jon. 1-4; 2 Tim. 2",
  "2 Ki. 13-14; 2 Chr. 25; 2 Tim. 3",
  "Amos 1-3; Ps. 80; 2 Tim. 4",
  "Amos 4-6; Ps. 86-87; Titus 1",
  "Amos 7-9; Ps. 104; Titus 2"
];

// July readings from the uploaded plan
const julyReadings = [
  "Is. 1-3; Titus 3",
  "Is. 4-5; Ps. 115-116; Jude",
  "Is. 6-7; 2 Chr. 26-27; Philem.",
  "2 Ki. 15-16; Hos. 1; Heb. 1",
  "Hos. 2-5; Heb. 2",
  "Hos. 6-9; Heb. 3",
  "Hos. 10-12; Ps. 73; Heb. 4",
  "Hos. 13-14; Ps. 100,102; Heb. 5",
  "Mic. 1-4; Heb. 6",
  "Mic. 5-7; Heb. 7",
  "Is. 8-10; Heb. 8",
  "Is. 11-14; Heb. 9",
  "Is. 15-18; Heb. 10",
  "Is. 19-21; Heb. 11",
  "Is. 22-24; Heb. 12",
  "Is. 25-28; Heb. 13",
  "Is. 29-31; Jas. 1",
  "Is. 32-35; Jas. 2",
  "2 Ki. 17; 2 Chr. 28; Ps. 46; Jas. 3",
  "2 Chr. 29-31; Jas. 4",
  "2 Ki. 18-19; 2 Chr. 32; Jas. 5",
  "Is. 36-37; Ps. 76; 1 Pet. 1",
  "2 Ki. 20; Is. 38-39; Ps. 75; 1 Pet. 2",
  "Is. 40-42; 1 Pet. 3",
  "Is. 43-45; 1 Pet. 4",
  "Is. 46-49; 1 Pet. 5",
  "Is. 50-52; Ps. 92; 2 Pet. 1",
  "Is. 53-56; 2 Pet. 2",
  "Is. 57-59; Ps. 103; 2 Pet. 3",
  "Is. 60-62; Jn. 1",
  "Is. 63-64; Ps. 107; Jn. 2"
];

// August readings from the uploaded plan
const augustReadings = [
  "Is. 65-66; Ps. 62; Jn. 3",
  "2 Ki. 21; 2 Chr. 33; Jn. 4",
  "Nah. 1-3; Jn. 5",
  "2 Ki. 22; 2 Chr. 34; Jn. 6",
  "2 Ki. 23; 2 Chr. 35; Jn. 7",
  "Hab. 1-3; Jn. 8",
  "Zeph. 1-3; Jn. 9",
  "Jer. 1-2; Jn. 10",
  "Jer. 3-4; Jn. 11",
  "Jer. 5-6; Jn. 12",
  "Jer. 7-9; Jn. 13",
  "Jer. 10-12; Jn. 14",
  "Jer. 13-15; Jn. 15",
  "Jer. 16-17; Ps. 96; Jn. 16",
  "Jer. 18-20; Ps. 93; Jn. 17",
  "2 Ki. 24; Jer. 22; Ps. 112; Jn. 18",
  "Jer. 23,25; Jn. 19",
  "Jer. 26,35-36; Jn. 20",
  "Jer. 45-47; Ps. 105; Jn. 21",
  "Jer. 48-49; Ps. 67; 1 Jn. 1",
  "Jer. 21,24,27; Ps. 118; 1 Jn. 2",
  "Jer. 28-30; 1 Jn. 3",
  "Jer. 31-32; 1 Jn. 4",
  "Jer. 33-34; Ps. 74; 1 Jn. 5",
  "Jer. 37-39; Ps. 79; 2 Jn.",
  "Jer. 50-51; 3 Jn.",
  "Jer. 52; Rev. 1; Ps. 143-144",
  "Ezek. 1-3; Rev. 2",
  "Ezek. 4-7; Rev. 3",
  "Ezek. 8-11; Rev. 4",
  "Ezek. 12-14; Rev. 5"
];

// September readings from the uploaded plan
const septemberReadings = [
  "Ezek. 15-16; Ps. 70; Rev. 6",
  "Ezek. 17-19; Rev. 7",
  "Ezek. 20-21; Ps. 111; Rev. 8",
  "Ezek. 22-24; Rev. 9",
  "Ezek. 25-28; Rev. 10",
  "Ezek. 29-32; Rev. 11",
  "2 Ki. 25; 2 Chr. 36; Jer. 40-41; Rev. 12",
  "Jer. 42-44; Ps. 48; Rev. 13",
  "Lam. 1-2; Obad; Rev. 14",
  "Lam. 3-5; Rev. 15",
  "Dan. 1-2; Rev. 16",
  "Dan. 3-4; Ps. 81; Rev. 17",
  "Ezek. 33-35; Rev. 18",
  "Ezek. 36-37; Ps. 110; Rev. 19",
  "Ezek. 38-39; Ps. 145; Rev. 20",
  "Ezek. 40-41; Ps. 128; Rev. 21",
  "Ezek. 42-44; Rev. 22",
  "Ezek. 45-46; Lk. 1",
  "Ezek. 47-48; Lk. 2",
  "Dan. 5-6; Ps. 130; Lk. 3",
  "Dan. 7-8; Ps. 137; Lk. 4",
  "Dan. 9-10; Ps. 123; Lk. 5",
  "Dan. 11-12; Lk. 6",
  "Ezra 1; Ps. 84-85; Lk. 7",
  "Ezra 2-3; Lk. 8",
  "Ezra 4; Ps. 113,127; Lk. 9",
  "Hag. 1-2; Ps. 129; Lk. 10",
  "Zech. 1-3; Lk. 11",
  "Zech. 4-6; Lk. 12",
  "Zech. 7-9; Lk. 13"
];

// October readings from the uploaded plan
const octoberReadings = [
  "Zech. 10-12; Ps. 126; Lk. 14",
  "Zech. 13-14; Ps. 147; Lk. 15",
  "Ezra 5-6; Ps. 138; Lk. 16",
  "Est. 1-2; Ps. 150; Lk. 17",
  "Est. 3-8; Lk. 18",
  "Est. 9-10; Lk. 19",
  "Ezra 7-8; Lk. 20",
  "Ezra 9-10; Ps. 131; Lk. 21",
  "Neh. 1-2; Ps. 133-134; Lk. 22",
  "Neh. 3-4; Lk. 23",
  "Neh. 5-6; Ps. 146; Lk. 24",
  "Neh. 7-8; Acts 1",
  "Neh. 9-10; Acts 2",
  "Neh. 11-12; Ps. 1; Acts 3",
  "Neh. 13; Mal. 1-2; Acts 4",
  "Mal. 3-4; Ps. 148; Acts 5",
  "Job 1-2; Acts 6-7",
  "Job 3-4; Acts 8-9",
  "Job 5; Ps. 108; Acts 10-11",
  "Job 6-8; Acts 12",
  "Job 9-10; Acts 13-14",
  "Job 11-12; Acts 15-16",
  "Job 13-14; Acts 17-18",
  "Job 15; Acts 19-20",
  "Job 16; Acts 21-23",
  "Job 17; Acts 24-26",
  "Job 18; Ps. 114; Acts 27-28",
  "Job 19; Mk. 1-2",
  "Job 20; Mk. 3-4",
  "Job 21; Mk. 5-6",
  "Job 22; Mk. 7-8"
];

// November readings from the uploaded plan
const novemberReadings = [
  "Ps. 121; Mk. 9-10",
  "Job 23-24; Mk. 11-12",
  "Job 25; Mk. 13-14",
  "Job 26-27; Mk. 15-16",
  "Job 28-29; Gal. 1-2",
  "Job 30; Ps. 120; Gal. 3-4",
  "Job 31-32; Gal. 5-6",
  "Job 33; 1 Cor. 1-3",
  "Job 34; 1 Cor. 4-6",
  "Job 35-36; 1 Cor. 7-8",
  "Ps. 122; 1 Cor. 9-11",
  "Job 37-38; 1 Cor. 12",
  "Job 39-40; 1 Cor. 13-14",
  "Ps. 149; 1 Cor. 15-16",
  "Job 41-42; 2 Cor. 1-2",
  "2 Cor. 3-6",
  "2 Cor. 7-10",
  "Ps. 124; 2 Cor. 11-13",
  "Mt. 1-4",
  "Mt. 5-7",
  "Mt. 8-10",
  "Mt. 11-13",
  "Mt. 14-16",
  "Mt. 17-19",
  "Mt. 20-22",
  "Mt. 23-25",
  "Ps. 125; Mt. 26-27",
  "Mt. 28; 1 Th. 1-3",
  "1 Th. 4-5; 2 Th. 1-3",
  "Rom. 1-4"
];

// December readings from the uploaded plan
const decemberReadings = [
  "Rom. 5-8",
  "Rom. 9-12",
  "Rom. 13-16",
  "Eph. 1-4",
  "Eph. 5-6; Ps. 119: 1-80",
  "Phil. 1-4",
  "Col. 1-4",
  "1 Tim. 1-4",
  "1 Tim. 5-6; Tit. 1-3",
  "2 Tim. 1-4",
  "Philem.; Heb. 1-4",
  "Heb. 5-8",
  "Heb. 9-11",
  "Heb. 12-13; Jude",
  "Jas. 1-5",
  "1 Pet. 1-5",
  "2 Pet. 1-3; Jn. 1",
  "Jn. 2-4",
  "Jn. 5-6",
  "Jn. 7-8",
  "Jn. 9-11",
  "Jn. 12-14",
  "Jn. 15-18",
  "Jn. 19-21",
  "1 Jn. 1-5",
  "Ps. 117,119: 81-176; 2 Jn.; 3 Jn.",
  "Rev. 1-4",
  "Rev. 5-9",
  "Rev. 10-14",
  "Rev. 15-18",
  "Rev. 19-22"
];

// Generate themes for January based on the readings
const getJanuaryTheme = (day: number): string => {
  if (day <= 7) return "Creation and Beginnings";
  if (day <= 14) return "Patriarchs and Promises";
  if (day <= 21) return "Joseph's Journey";
  if (day <= 24) return "Exodus Begins";
  return "Deliverance and Law";
};

// Generate themes for February based on the readings
const getFebruaryTheme = (day: number): string => {
  if (day <= 5) return "Tabernacle and Worship";
  if (day <= 11) return "Holiness and Sacrifice";
  if (day <= 16) return "Laws and Offerings";
  if (day <= 21) return "Wilderness Preparation";
  if (day <= 26) return "Journey and Leadership";
  return "Gospel Beginnings";
};

// Generate themes for March based on the readings
const getMarchTheme = (day: number): string => {
  if (day <= 4) return "Wilderness Completion";
  if (day <= 9) return "Deuteronomy Begins";
  if (day <= 15) return "Laws and Covenant";
  if (day <= 17) return "Moses' Final Words";
  if (day <= 24) return "Conquering the Land";
  if (day <= 26) return "Joshua's Leadership";
  return "Judges and Deliverance";
};

// Generate themes for April based on the readings
const getAprilTheme = (day: number): string => {
  if (day <= 4) return "Judges and Deliverance";
  if (day <= 6) return "Ruth's Faithfulness";
  if (day <= 13) return "Samuel's Ministry";
  if (day <= 20) return "David's Rise";
  if (day <= 25) return "David and Saul";
  return "David's Kingdom";
};

// Generate themes for May based on the readings
const getMayTheme = (day: number): string => {
  if (day <= 3) return "David's Reign Established";
  if (day <= 11) return "David's Triumphs and Trials";
  if (day <= 15) return "Kingdom Organization";
  if (day <= 19) return "Solomon's Wisdom";
  if (day <= 24) return "Temple Building";
  if (day <= 25) return "Kingdom Glory";
  return "Wisdom Literature";
};

// Generate themes for June based on the readings
const getJuneTheme = (day: number): string => {
  if (day <= 5) return "Proverbs and Wisdom";
  if (day <= 9) return "Ecclesiastes and Life";
  if (day <= 11) return "Song of Songs";
  if (day <= 18) return "Kingdom Division";
  if (day <= 24) return "Elijah and Elisha";
  if (day <= 26) return "Minor Prophets";
  return "Prophetic Voices";
};

// Generate themes for July based on the readings
const getJulyTheme = (day: number): string => {
  if (day <= 3) return "Isaiah's Call and Vision";
  if (day <= 8) return "Hosea's Love and Judgment";
  if (day <= 10) return "Micah's Justice and Mercy";
  if (day <= 16) return "Isaiah's Prophecies";
  if (day <= 18) return "Isaiah and James";
  if (day <= 21) return "Hezekiah's Reign";
  if (day <= 23) return "Isaiah's Comfort";
  if (day <= 26) return "Servant Songs";
  if (day <= 29) return "Isaiah's Glory";
  return "New Covenant";
};

// Generate themes for August based on the readings
const getAugustTheme = (day: number): string => {
  if (day <= 2) return "Isaiah's Final Vision";
  if (day <= 5) return "Josiah's Reforms";
  if (day <= 7) return "Minor Prophets' Warnings";
  if (day <= 13) return "Jeremiah's Early Ministry";
  if (day <= 18) return "Jeremiah and John";
  if (day <= 21) return "Jeremiah's Prophecies";
  if (day <= 24) return "Jeremiah's Hope";
  if (day <= 26) return "Jeremiah's Final Words";
  if (day <= 27) return "Exile and Revelation";
  return "Ezekiel's Visions";
};

// Generate themes for September based on the readings
const getSeptemberTheme = (day: number): string => {
  if (day <= 6) return "Ezekiel's Prophecies";
  if (day <= 7) return "Fall of Jerusalem";
  if (day <= 10) return "Lamentations and Exile";
  if (day <= 12) return "Daniel's Wisdom";
  if (day <= 17) return "Ezekiel's Temple Vision";
  if (day <= 19) return "Ezekiel's Restoration";
  if (day <= 23) return "Daniel's Prophecies";
  if (day <= 26) return "Return from Exile";
  if (day <= 27) return "Haggai's Encouragement";
  return "Zechariah's Hope";
};

// Generate themes for October based on the readings
const getOctoberTheme = (day: number): string => {
  if (day <= 2) return "Zechariah's Final Prophecies";
  if (day <= 8) return "Restoration and Reform";
  if (day <= 11) return "Nehemiah's Leadership";
  if (day <= 13) return "Community Rebuilding";
  if (day <= 16) return "Final Prophetic Voice";
  if (day <= 24) return "Job's Testing and Faith";
  if (day <= 27) return "Job's Suffering and Hope";
  return "Job's Wisdom and Mark's Gospel";
};

// Generate themes for November based on the readings
const getNovemberTheme = (day: number): string => {
  if (day <= 4) return "Job's Completion and Mark";
  if (day <= 7) return "Job's Final Wisdom";
  if (day <= 10) return "Job's Vindication";
  if (day <= 14) return "Job's Restoration";
  if (day <= 15) return "Job's Triumph";
  if (day <= 18) return "Paul's Corinthian Letters";
  if (day <= 26) return "Matthew's Gospel";
  if (day <= 28) return "Matthew's Conclusion";
  return "Thessalonian Letters and Romans";
};

// Generate themes for December based on the readings
const getDecemberTheme = (day: number): string => {
  if (day <= 3) return "Romans: Righteousness and Grace";
  if (day <= 7) return "Prison Epistles: Unity in Christ";
  if (day <= 10) return "Pastoral Letters: Church Leadership";
  if (day <= 14) return "Hebrews: Christ's Supremacy";
  if (day <= 16) return "General Epistles: Living Faith";
  if (day <= 24) return "John's Gospel: Word Made Flesh";
  if (day <= 25) return "John's Letters: Love and Truth";
  if (day <= 26) return "Psalm 119: God's Perfect Word";
  return "Revelation: Christ's Victory";
};

// Helper function to generate all 365 days (2025 is not a leap year)
export const generateFullYearPlan = (): ReadingPlan => {
  const days = [];
  const startDate = new Date(2025, 0, 1); // January 1, 2025
  
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const month = currentDate.getMonth() + 1;
    const dayOfMonth = currentDate.getDate();
    const dayOfYear = i + 1;
    
    let passages: Passage[] = [];
    let theme = "";
    
    if (month === 1 && dayOfMonth <= 31) {
      // Use the accurate January readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < januaryReadings.length) {
        passages = parsePassages(januaryReadings[readingIndex]);
        theme = getJanuaryTheme(dayOfMonth);
      }
    } else if (month === 2 && dayOfMonth <= 28) {
      // Use the accurate February readings (2025 is not a leap year)
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < februaryReadings.length) {
        passages = parsePassages(februaryReadings[readingIndex]);
        theme = getFebruaryTheme(dayOfMonth);
      }
    } else if (month === 3 && dayOfMonth <= 31) {
      // Use the accurate March readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < marchReadings.length) {
        passages = parsePassages(marchReadings[readingIndex]);
        theme = getMarchTheme(dayOfMonth);
      }
    } else if (month === 4 && dayOfMonth <= 30) {
      // Use the accurate April readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < aprilReadings.length) {
        passages = parsePassages(aprilReadings[readingIndex]);
        theme = getAprilTheme(dayOfMonth);
      }
    } else if (month === 5 && dayOfMonth <= 31) {
      // Use the accurate May readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < mayReadings.length) {
        passages = parsePassages(mayReadings[readingIndex]);
        theme = getMayTheme(dayOfMonth);
      }
    } else if (month === 6 && dayOfMonth <= 30) {
      // Use the accurate June readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < juneReadings.length) {
        passages = parsePassages(juneReadings[readingIndex]);
        theme = getJuneTheme(dayOfMonth);
      }
    } else if (month === 7 && dayOfMonth <= 31) {
      // Use the accurate July readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < julyReadings.length) {
        passages = parsePassages(julyReadings[readingIndex]);
        theme = getJulyTheme(dayOfMonth);
      }
    } else if (month === 8 && dayOfMonth <= 31) {
      // Use the accurate August readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < augustReadings.length) {
        passages = parsePassages(augustReadings[readingIndex]);
        theme = getAugustTheme(dayOfMonth);
      }
    } else if (month === 9 && dayOfMonth <= 30) {
      // Use the accurate September readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < septemberReadings.length) {
        passages = parsePassages(septemberReadings[readingIndex]);
        theme = getSeptemberTheme(dayOfMonth);
      }
    } else if (month === 10 && dayOfMonth <= 31) {
      // Use the accurate October readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < octoberReadings.length) {
        passages = parsePassages(octoberReadings[readingIndex]);
        theme = getOctoberTheme(dayOfMonth);
      }
    } else if (month === 11 && dayOfMonth <= 30) {
      // Use the accurate November readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < novemberReadings.length) {
        passages = parsePassages(novemberReadings[readingIndex]);
        theme = getNovemberTheme(dayOfMonth);
      }
    } else if (month === 12 && dayOfMonth <= 31) {
      // Use the accurate December readings
      const readingIndex = dayOfMonth - 1;
      if (readingIndex < decemberReadings.length) {
        passages = parsePassages(decemberReadings[readingIndex]);
        theme = getDecemberTheme(dayOfMonth);
      }
    } else {
      // Fallback for any edge cases
      passages = [];
      theme = "Walking with God";
    }
    
    days.push({
      day: dayOfYear,
      date: currentDate.toISOString().split('T')[0],
      passages,
      theme
    });
  }
  
  return {
    name: "Classic Reading Plan",
    days
  };
};
