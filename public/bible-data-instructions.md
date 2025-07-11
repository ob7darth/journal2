# Bible Data Setup Instructions

## Option 1: Download Bible Data File (Recommended)

To use the full NASB Bible text in the Life Journal app:

1. **Download the Bible data file:**
   - Visit: https://archive.org/details/nasb-new-american-standard-bible-nasb
   - Download the text file: `NASB New American Standard Bible (NASB)_djvu.txt`

2. **Add to your project:**
   - Rename the file to `bible-data.txt`
   - Place it in the `public` folder of your project
   - The app will automatically detect and load this file

3. **Verify the setup:**
   - Restart your development server
   - The Scripture Viewer should now display full Bible text
   - Search functionality will work with the complete Bible

## Option 2: Use Built-in Sample Data

If you prefer not to download the full Bible data:

- The app includes sample verses from key passages
- All functionality works with limited content
- Users can still access full passages via Bible Gateway links

## Copyright Notice

Please ensure you have proper rights to use any Bible text data. The NASB is copyrighted material. This integration is designed for personal study and non-commercial use.

## Technical Details

The app uses multiple loading strategies:

1. **Local file**: Loads from `public/bible-data.txt` if available
2. **Proxy service**: Attempts to fetch from archive.org (may have CORS issues)
3. **Fallback data**: Uses built-in sample verses

The Bible service automatically handles parsing and provides:
- Full passage lookup by book, chapter, and verse ranges
- Text search across all loaded content
- Statistics about available content
- Graceful fallbacks when data is unavailable

## File Format

The expected format for Bible data is:
```
Genesis 1:1 In the beginning God created the heavens and the earth.
Genesis 1:2 The earth was formless and void...
Psalms 23:1 The LORD is my shepherd, I shall not want.
```

Each line should contain: `Book Chapter:Verse Text`