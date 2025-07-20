import React, { useState } from 'react';
import { Heart, Send, X } from 'lucide-react';
import { supabase, canUseSupabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/SupabaseAuthService';

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  userName?: string;
}

interface PrayerResponseFormProps {
  request: PrayerRequest;
  onClose: () => void;
  onSubmit?: () => void;
}

const PrayerResponseForm: React.FC<PrayerResponseFormProps> = ({ 
  request, 
  onClose, 
  onSubmit 
}) => {
  const [responseType, setResponseType] = useState<'praying' | 'encouragement' | 'testimony'>('praying');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = supabaseAuthService.getCurrentUser();

  const responseTypes = [
    { value: 'praying', label: '🙏 I\'m Praying', description: 'Let them know you\'re praying for them' },
    { value: 'encouragement', label: '💪 Encouragement', description: 'Share words of encouragement' },
    { value: 'testimony', label: '✨ Testimony', description: 'Share how God worked in a similar situation' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to respond to prayer requests');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Always store responses locally for all users
      const storageKey = user.isGuest ? 'guest-prayer-responses' : `prayer-responses-${user.id}`;
      const existingResponses = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const newResponse = {
        id: Date.now().toString(),
        prayerRequestId: request.id,
        responseType,
        message: message.trim(),
        userName: user.name,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      existingResponses.push(newResponse);
      localStorage.setItem(storageKey, JSON.stringify(existingResponses));
      
      // For authenticated users, also try to save to Supabase (but don't fail if it doesn't work)
      if (!user.isGuest && canUseSupabase() && supabase) {
        try {
          // Only save to Supabase if the request ID looks like a database ID
          if (request.id.startsWith('db_')) {
            const actualRequestId = request.id.replace('db_', '');
            await supabase
              .from('prayer_responses')
              .insert({
                prayer_request_id: actualRequestId,
                user_id: user.id,
                response_type: responseType,
                message: message.trim()
              });
          }
        } catch (supabaseError) {
          console.warn('Failed to save to Supabase, but saved locally:', supabaseError);
          // Don't throw error - local save was successful
        }
      }

      onSubmit?.();
      onClose();
      
      // Show success message
      const responseTypeText = responseType === 'praying' ? 'prayer' : 
                              responseType === 'encouragement' ? 'encouragement' : 'testimony';
      alert(`Your ${responseTypeText} has been sent! Thank you for caring for this person.`);
    } catch (err) {
      console.error('Error submitting prayer response:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit response. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          errorMessage = 'Network error. Your response has been saved locally.';
        } else if (err.message.includes('Database not available')) {
          errorMessage = 'Database temporarily unavailable. Your response has been saved locally.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      setError(errorMessage);
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
              <h2 className="text-xl font-bold text-gray-900">Respond with Prayer</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Prayer Request Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
            <p className="text-xs text-gray-500">Requested by {request.userName}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Response Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you like to respond?
              </label>
              <div className="space-y-2">
                {responseTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      responseType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="responseType"
                      value={type.value}
                      checked={responseType === type.value}
                      onChange={(e) => setResponseType(e.target.value as any)}
                      className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message {responseType === 'praying' ? '(Optional)' : ''}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  responseType === 'praying' 
                    ? 'Add a personal note (optional)...'
                    : responseType === 'encouragement'
                    ? 'Share words of encouragement...'
                    : 'Share your testimony or experience...'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/300 characters</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Response
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrayerResponseForm;