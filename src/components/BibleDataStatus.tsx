import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { bibleService } from '../services/BibleService';

const BibleDataStatus: React.FC = () => {
  const [stats, setStats] = useState({ totalVerses: 0, totalBooks: 0, totalChapters: 0 });
  const [loading, setLoading] = useState(true);

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

  const hasData = stats.totalVerses > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database size={20} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900">Bible Data Status</h3>
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
            {hasData ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <AlertCircle size={16} className="text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              {hasData 
                ? 'Local CSV Data Active' 
                : 'Using Bible Gateway Links'
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

          {/* Help Text */}
          <div className="text-xs text-gray-500">
            {hasData ? (
              'Using local Bible data for basic passages. All passages also link to Bible Gateway for complete reading.'
            ) : (
              'All scripture passages link directly to Bible Gateway for complete Bible access.'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleDataStatus;