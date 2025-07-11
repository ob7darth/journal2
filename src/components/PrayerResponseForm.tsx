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
      if (user.isGuest) {
        // For guest users, store in localStorage
        const guestResponses = JSON.parse(localStorage.getItem('guest-prayer-responses') || '[]');
        const newResponse = {
          id: Date.now().toString(),
          prayerRequestId: request.id,
          responseType,
          message: message.trim(),
          userName: user.name,
          createdAt: new Date().toISOString()
        };
        guestResponses.push(newResponse);
        localStorage.setItem('guest-prayer-responses', JSON.stringify(guestResponses));
      } else {
        // For authenticated users, save to Supabase if available
        if (canUseSupabase() && supabase) {
          const { error: insertError } = await supabase
            .from('prayer_responses')
            .insert({
              prayer_request_id: request.id,
              user_id: user.id,
              response_type: responseType,
              message: message.trim()
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
      alert('Your response has been sent! Thank you for caring for this person.');
    } catch (err) {
      console.error('Error submitting prayer response:', err);
      setError('Failed to submit response. Please try again.');
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