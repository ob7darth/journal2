import React, { useState, useEffect } from 'react';
import { Passage } from '../types/ReadingPlan';
import { BookOpen, ExternalLink, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { bibleService, BiblePassage } from '../services/BibleService';
import { supabaseBibleService } from '../services/SupabaseBibleService';

interface ScriptureViewerProps {
  passage: Passage;
  version?: string;
}

const ScriptureViewer: React.FC<ScriptureViewerProps> = ({ 
  passage, 
  version = 'ASV'
}) => {
  const [scripture, setScripture] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(true); // Auto-expand to show content
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Use the displayText if available, otherwise format as chapter only
  const getDisplayText = (): string => {
    if (passage.displayText) {
      return passage.displayText;
    }
    
    // Fallback: just show book and chapter (no verses)
    const { book, chapter, endChapter } = passage;
    
    if (endChapter && endChapter !== chapter) {
      return `${book} ${chapter}-${endChapter}`;
    }
    
    return `${book} ${chapter}`;
  };

  const formattedPassage = getDisplayText();
  const bibleGatewayUrl = bibleService.getBibleGatewayUrl(passage.book, passage.chapter, passage.verses, version);

  useEffect(() => {
    // Check if Bible data is loaded
    setDataLoaded(bibleService.isLoaded());
    
    const fetchScripture = async () => {
      // Always try to fetch scripture, not just when expanded
      
      setLoading(true);
      setError(null);
      
      try {
        // Wait for data to load if not ready, with multiple attempts
        let attempts = 0;
        while (!bibleService.isLoaded() && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        const result = await bibleService.getPassage(passage.book, passage.chapter, passage.verses);
        if (result) {
          setScripture(result);
          setDataLoaded(true);
        } else {
          // Check if we have any data at all
          const stats = await bibleService.getStats();
          if (stats.totalVerses > 0) {
            setError(`Scripture not found: ${passage.book} ${passage.chapter}:${passage.verses}. This passage may not be available in our current Bible data.`);
          } else {
            setError('No Bible data loaded. Please configure your Bible data source in the Resources tab.');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to load scripture. Please try again later.';
        setError(errorMessage);
        console.error('Error fetching scripture:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScripture();
  }, [passage.book, passage.chapter, passage.verses]); // Remove expanded dependency

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const dataSource = supabaseBibleService.hasData() ? 'Supabase JSON' : 'Local Data';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-primary-600" />
          <div>
            <span className="font-semibold text-gray-900">{formattedPassage}</span>
            <span className="text-sm text-gray-500 ml-2">
              ({version})
              {!dataLoaded && <span className="text-yellow-600 ml-1">• Loading...</span>}
              {dataLoaded && <span className="text-green-600 ml-1">• {dataSource}</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={bibleGatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 p-1"
            onClick={(e) => e.stopPropagation()}
            title="Open in Bible Gateway"
          >
            <ExternalLink size={16} />
          </a>
          {expanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader size={20} className="animate-spin" />
                <span>
                  {!dataLoaded ? 'Loading Bible data...' : 'Loading scripture...'}
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              {!dataLoaded && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">The Bible database is still loading. This may take a moment.</p>
                  <p>You can read this passage on Bible Gateway using the link below.</p>
                </div>
              )}
              <div className="mt-4">
                <a 
                  href={bibleGatewayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Read on Bible Gateway
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ) : scripture && scripture.text.length > 0 ? (
            <div className="p-6">
              <div className="space-y-3">
                {scripture.text.map((verse, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-sm font-medium text-primary-600 min-w-[2rem]">
                      {verse.verse}
                    </span>
                    <p className="text-gray-800 leading-relaxed flex-1">
                      {verse.text}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
                <a 
                  href={bibleGatewayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Read full chapter on Bible Gateway
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">
                {!dataLoaded 
                  ? 'Bible data is still loading. You can read this passage on Bible Gateway.'
                  : 'This passage is not available in our local database. You can read it on Bible Gateway.'
                }
              </p>
              <a 
                href={bibleGatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Read on Bible Gateway
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScriptureViewer;