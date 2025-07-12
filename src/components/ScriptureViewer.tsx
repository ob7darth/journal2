import React, { useState, useEffect } from 'react';
import { Passage } from '../types/ReadingPlan';
import { BookOpen, ExternalLink, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { bibleService, BiblePassage } from '../services/BibleService';

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
  const [expanded, setExpanded] = useState<boolean>(false);

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
    const fetchScripture = async () => {
      if (!expanded) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await bibleService.getPassage(passage.book, passage.chapter, passage.verses);
        if (result) {
          setScripture(result);
        } else {
          setError('Scripture not found in local data. Please use the Bible Gateway link below.');
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
  }, [passage.book, passage.chapter, passage.verses, expanded]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

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
            <span className="text-sm text-gray-500 ml-2">({version})</span>
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
                <span>Loading scripture...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-gray-600 mb-4">{error}</div>
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
                This passage is available on Bible Gateway for complete reading.
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