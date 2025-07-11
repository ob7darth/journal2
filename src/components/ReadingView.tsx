import React from 'react';
import { PenTool, Share2, CheckCircle } from 'lucide-react';
import { DailyReading } from '../types/ReadingPlan';
import ScriptureViewer from './ScriptureViewer';

interface ReadingViewProps {
  reading: DailyReading;
  onStartSOAP: () => void;
  hasSOAPEntry: boolean;
  onShareEntry?: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ 
  reading, 
  onStartSOAP, 
  hasSOAPEntry,
  onShareEntry
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Theme Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{reading.theme}</h2>
        <p className="text-gray-600">
          Today's reading will guide you through {reading.theme.toLowerCase()}
        </p>
      </div>

      {/* Scripture Passages */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Passages</h3>
        <div className="space-y-3">
          {reading.passages.map((passage, index) => (
            <ScriptureViewer key={index} passage={passage} />
          ))}
        </div>
      </div>

      {/* SOAP Study Section */}
      <div className="bg-warm-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-warm-800 mb-3">SOAP Study Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📖</span>
              <div>
                <h4 className="font-medium text-warm-800">Scripture</h4>
                <p className="text-sm text-warm-700">Choose a verse that stands out</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">👁️</span>
              <div>
                <h4 className="font-medium text-warm-800">Observation</h4>
                <p className="text-sm text-warm-700">What is this passage saying?</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-medium text-warm-800">Application</h4>
                <p className="text-sm text-warm-700">How does this apply to your life?</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🙏</span>
              <div>
                <h4 className="font-medium text-warm-800">Prayer</h4>
                <p className="text-sm text-warm-700">Talk to God about what you learned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStartSOAP}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
            hasSOAPEntry
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {hasSOAPEntry ? (
            <>
              <CheckCircle size={20} />
              View SOAP Entry
            </>
          ) : (
            <>
              <PenTool size={20} />
              Start SOAP Study
            </>
          )}
        </button>
        
        {hasSOAPEntry && onShareEntry && (
          <button
            onClick={onShareEntry}
            className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Share2 size={20} />
            Share Entry
          </button>
        )}
      </div>
    </div>
  );
};

export default ReadingView;