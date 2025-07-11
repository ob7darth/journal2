import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader, Settings } from 'lucide-react';
import { bibleService } from '../services/BibleService';
import { supabaseBibleService } from '../services/SupabaseBibleService';

interface BibleDataStatusProps {
  onConfigure?: (bucketName: string, fileName: string) => void;
}

const BibleDataStatus: React.FC<BibleDataStatusProps> = ({ onConfigure }) => {
  const [stats, setStats] = useState({ totalVerses: 0, totalBooks: 0, totalChapters: 0 });
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [bucketName, setBucketName] = useState('bible-data');
  const [fileName, setFileName] = useState('bibles.xlsx');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const bibleStats = await bibleService.getStats();
      setStats(bibleStats);
    } catch (error) {
      console.error('Error loading Bible stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = () => {
    bibleService.configureSupabaseSource(bucketName, fileName);
    onConfigure?.(bucketName, fileName);
    setShowConfig(false);
    // Reload stats after configuration
    setTimeout(() => {
      loadStats();
      // Force a page refresh to ensure all components get the new data
      window.location.reload();
    }, 2000);
  };

  const hasData = stats.totalVerses > 0;
  const hasSupabaseData = supabaseBibleService.hasData();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Bible Data Status</h3>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Configure data source"
        >
          <Settings size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Loading Bible data...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Data Source Status */}
          <div className="flex items-center gap-2">
            {hasSupabaseData ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : hasData ? (
              <CheckCircle size={16} className="text-yellow-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
            <span className="text-sm font-medium">
              {hasSupabaseData 
                ? 'Supabase JSON Data Active' 
                : hasData 
                ? 'Fallback Data Active' 
                : 'No Bible Data Available'
              }
            </span>
          </div>

          {/* Statistics */}
          {hasData && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{stats.totalBooks}</div>
                <div className="text-xs text-gray-600">Books</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{stats.totalChapters}</div>
                <div className="text-xs text-gray-600">Chapters</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{stats.totalVerses.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Verses</div>
              </div>
            </div>
          )}

          {/* Configuration Panel */}
          {showConfig && (
            <div className="border-t border-gray-200 pt-3 space-y-3">
              <h4 className="font-medium text-gray-900">Configure Supabase Source</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Bucket Name
                  </label>
                  <input
                    type="text"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., bible-data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    JSON File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., bible.json"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfigure}
                    className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
                  >
                    Apply Configuration
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="px-3 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500">
            {hasSupabaseData ? (
              'Using Bible data from your Supabase storage bucket. All passages and search will use this data.'
            ) : hasData ? (
              'Using fallback Bible data. Upload a JSON file to Supabase storage for complete Bible access.'
            ) : (
              <>
                No Bible data available. Please:
                <br />
                1. Create a storage bucket named '{bucketName}' in your Supabase dashboard
                <br />
                2. Upload your JSON file as '{fileName}' to that bucket
                <br />
                3. Set the bucket to public or configure RLS policies for read access
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleDataStatus;