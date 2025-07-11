import React, { useState, useRef, useEffect } from 'react';
import { Save, ArrowLeft, BookOpen, Share2, Search, Clock, Heart, Plus } from 'lucide-react';
import { DailyReading } from '../types/ReadingPlan';
import { SOAPEntry } from '../types/SOAPEntry';
import { BibleVerse } from '../services/BibleService';
import BibleSearch from './BibleSearch';
import PrayerRequestForm from './PrayerRequestForm';
import PrayerRequestsList from './PrayerRequestsList';

interface SOAPFormProps {
  day: number;
  reading: DailyReading;
  existingEntry?: SOAPEntry;
  onSave: (day: number, entry: SOAPEntry) => void;
  onBack: () => void;
  onShare?: (entry: SOAPEntry) => void;
}

// Custom hook for auto-expanding textarea
const useAutoExpandTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to expand as needed
      textarea.style.height = `${Math.max(textarea.scrollHeight, 96)}px`; // Minimum 96px (h-24)
    }
  }, [value]);

  return textareaRef;
};

const SOAPForm: React.FC<SOAPFormProps> = ({ 
  day, 
  reading, 
  existingEntry, 
  onSave, 
  onBack,
  onShare
}) => {
  const [title, setTitle] = useState(existingEntry?.title || '');
  const [scripture, setScripture] = useState(existingEntry?.scripture || '');
  const [observation, setObservation] = useState(existingEntry?.observation || '');
  const [application, setApplication] = useState(existingEntry?.application || '');
  const [prayer, setPrayer] = useState(existingEntry?.prayer || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showBibleSearch, setShowBibleSearch] = useState(false);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showPrayerRequests, setShowPrayerRequests] = useState(false);

  // Auto-expanding textarea refs
  const scriptureRef = useAutoExpandTextarea(scripture);
  const observationRef = useAutoExpandTextarea(observation);
  const applicationRef = useAutoExpandTextarea(application);
  const prayerRef = useAutoExpandTextarea(prayer);

  // Check if entry is complete (all fields filled)
  const isComplete = title.trim() && scripture.trim() && observation.trim() && application.trim() && prayer.trim();
  
  // Check if there's any content to save
  const hasContent = title.trim() || scripture.trim() || observation.trim() || application.trim() || prayer.trim();

  const handleSave = async () => {
    if (!hasContent) {
      alert('Please add some content before saving.');
      return;
    }

    setIsSaving(true);
    
    try {
      const entry: SOAPEntry = {
        day,
        title: title.trim(),
        scripture: scripture.trim(),
        observation: observation.trim(),
        application: application.trim(),
        prayer: prayer.trim(),
        createdAt: existingEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simulate save delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSave(day, entry);
      
      // Show appropriate success message
      if (isComplete) {
        alert('Your SOAP entry has been saved!');
      } else {
        alert('Your progress has been saved! You can continue working on this entry later.');
      }
    } catch (error) {
      console.error('Error saving SOAP entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!isComplete) {
      alert('Please complete all sections of your SOAP entry before sharing.');
      return;
    }

    const entry: SOAPEntry = {
      day,
      title: title.trim(),
      scripture: scripture.trim(),
      observation: observation.trim(),
      application: application.trim(),
      prayer: prayer.trim(),
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onShare?.(entry);
  };

  const handleVerseSelect = (verse: BibleVerse) => {
    const verseText = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    setScripture(verseText);
    setShowBibleSearch(false);
  };

  const getFieldStatus = (value: string) => {
    if (value.trim()) {
      return { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' };
    }
    return { icon: '○', color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Reading
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Day {day} SOAP Study
            </h2>
            {hasContent && !isComplete && (
              <div className="flex items-center gap-1 text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <Clock size={14} />
                In Progress
              </div>
            )}
            {isComplete && (
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ Complete
              </div>
            )}
          </div>
        </div>
        
        {/* Reading Reference */}
        <div className="bg-warm-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-warm-600" />
            <span className="font-medium text-warm-800">Today's Reading:</span>
          </div>
          <div className="text-sm text-warm-700">
            {reading.passages.map((passage, index) => (
              <span key={index}>
                {passage.book} {passage.chapter}:{passage.verses}
                {index < reading.passages.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Progress</span>
            <span className="text-sm text-blue-700">
              {[title, scripture, observation, application, prayer].filter(field => field.trim()).length}/5 sections
            </span>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Title', value: title },
              { label: 'Scripture', value: scripture },
              { label: 'Observation', value: observation },
              { label: 'Application', value: application },
              { label: 'Prayer', value: prayer }
            ].map((field, index) => {
              const status = getFieldStatus(field.value);
              return (
                <div
                  key={index}
                  className={`flex-1 text-center py-1 px-2 rounded text-xs ${status.bg} ${status.color}`}
                  title={field.label}
                >
                  {status.icon}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            📝 Entry Title
            <span className="font-normal text-gray-600 ml-2">
              Give your study a meaningful title (optional)
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 'God's Love in Creation', 'Finding Peace in Trials'..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-colors"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
        </div>
        {/* Scripture */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-800">
              📖 Scripture
              <span className="font-normal text-gray-600 ml-2">
                Choose a verse that stands out to you (optional)
              </span>
            </label>
            <button
              onClick={() => setShowBibleSearch(!showBibleSearch)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Search size={16} />
              Search Verses
            </button>
          </div>
          
          {showBibleSearch && (
            <div className="mb-4">
              <BibleSearch onVerseSelect={handleVerseSelect} />
            </div>
          )}
          
          <textarea
            ref={scriptureRef}
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="Write the verse that spoke to you today... (You can save and come back to this later)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-colors resize-none overflow-hidden"
            style={{ minHeight: '96px' }}
            rows={3}
          />
        </div>

        {/* Observation */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            👁️ Observation
            <span className="font-normal text-gray-600 ml-2">
              What is this passage saying? (optional)
            </span>
          </label>
          <textarea
            ref={observationRef}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="What do you observe about this scripture? What is the context? What is God saying? (You can save your progress and continue later)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-colors resize-none overflow-hidden"
            style={{ minHeight: '128px' }}
            rows={4}
          />
        </div>

        {/* Application */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            🎯 Application
            <span className="font-normal text-gray-600 ml-2">
              How does this apply to your life? (optional)
            </span>
          </label>
          <textarea
            ref={applicationRef}
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            placeholder="How can you apply this to your life today? What changes might God be calling you to make? (Save your thoughts as you go)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-colors resize-none overflow-hidden"
            style={{ minHeight: '128px' }}
            rows={4}
          />
        </div>

        {/* Prayer */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            🙏 Prayer
            <span className="font-normal text-gray-600 ml-2">
              Talk to God about what you learned (optional)
            </span>
          </label>
          <textarea
            ref={prayerRef}
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            placeholder="Write a prayer based on what you've learned today... (Your progress is automatically saved)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-colors resize-none overflow-hidden"
            style={{ minHeight: '128px' }}
            rows={4}
          />
        </div>

        {/* Helper Text */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Study Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Give your entry a meaningful title to help you remember the key theme</li>
            <li>• Text boxes expand automatically as you type - write as much as you need!</li>
            <li>• You can save your progress at any time and continue later</li>
            <li>• Fill out sections as you feel led - there's no pressure to complete everything at once</li>
            <li>• Your entries are automatically saved to your device</li>
            <li>• Complete all sections to unlock sharing with others</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasContent}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                {isComplete ? 'Save Complete Entry' : hasContent ? 'Save Progress' : 'Save Entry'}
              </>
            )}
          </button>

          {onShare && (
            <button
              onClick={handleShare}
              disabled={!isComplete}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                isComplete
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Share2 size={20} />
              {isComplete ? 'Share Entry' : 'Complete All Sections to Share'}
            </button>
          )}
        </div>

        {/* Prayer Request Section */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="text-red-600" size={20} />
              Prayer Requests
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrayerRequests(!showPrayerRequests)}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showPrayerRequests ? 'Hide' : 'View All'}
              </button>
              <button
                onClick={() => setShowPrayerForm(true)}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Plus size={14} />
                Add Request
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick Prayer Request */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                <strong>Need prayer?</strong> Share your request with the community. Others will pray for you and offer encouragement.
              </p>
              <button
                onClick={() => setShowPrayerForm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Submit Prayer Request
              </button>
            </div>

            {/* Prayer Requests List */}
            {showPrayerRequests && (
              <PrayerRequestsList limit={3} showHeader={false} />
            )}
          </div>
        </div>
      </div>

      {/* Prayer Request Form Modal */}
      {showPrayerForm && (
        <PrayerRequestForm
          onClose={() => setShowPrayerForm(false)}
          onSubmit={() => {
            // Refresh prayer requests if they're visible
            if (showPrayerRequests) {
              // The PrayerRequestsList component will handle its own refresh
            }
          }}
        />
      )}
    </div>
  );
};

export default SOAPForm;