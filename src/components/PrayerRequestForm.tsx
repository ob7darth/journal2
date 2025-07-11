import React, { useState } from 'react';
import { Heart, Send, Users, Lock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { canUseSupabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/SupabaseAuthService';

interface PrayerRequestFormProps {
  onClose: () => void;
  onSubmit?: () => void;
}

const PrayerRequestForm: React.FC<PrayerRequestFormProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = supabaseAuthService.getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to submit a prayer request');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (user.isGuest) {
        // For guest users, store in localStorage
        const guestRequests = JSON.parse(localStorage.getItem('guest-prayer-requests') || '[]');
        const newRequest = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim(),
          isAnonymous,
          isPublic,
          createdAt: new Date().toISOString(),
          userName: isAnonymous ? 'Anonymous' : user.name
        };
        guestRequests.push(newRequest);
        localStorage.setItem('guest-prayer-requests', JSON.stringify(guestRequests));
      } else {
        // For authenticated users, save to Supabase
        if (canUseSupabase() && supabase) {
          const { error: insertError } = await supabase
            .from('prayer_requests')
            .insert({
              user_id: user.id,
              title: title.trim(),
              description: description.trim(),
              is_anonymous: isAnonymous,
              is_public: isPublic
            });

          if (insertError) {
            throw insertError;
          }
        } else {
          throw new Error('Database not available');
        }
      }

      onSubmit?.();
      onClose();
      
      // Show success message
      alert('Prayer request submitted successfully! The community will be praying for you.');
    } catch (err) {
      console.error('Error submitting prayer request:', err);
      setError('Failed to submit prayer request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Submit Prayer Request</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prayer Request Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for your prayer request..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share more details about what you'd like prayer for..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
            </div>

            {/* Privacy Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="anonymous" className="flex items-center gap-2 text-sm text-gray-700">
                  <Lock size={16} />
                  Submit anonymously
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="public" className="flex items-center gap-2 text-sm text-gray-700">
                  <Users size={16} />
                  Share with community
                </label>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🙏 Prayer Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your request will be visible to the community for 30 days</li>
                <li>• Others can respond with prayers and encouragement</li>
                <li>• You can mark your request as answered anytime</li>
                <li>• Anonymous requests hide your name but show your request</li>
              </ul>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Prayer Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrayerRequestForm;