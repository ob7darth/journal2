import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Clock, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/SupabaseAuthService';
import PrayerResponseForm from './PrayerResponseForm';

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  answeredAt?: string;
  answerDescription?: string;
  createdAt: string;
  userName?: string;
  userId?: string;
  responseCount?: number;
}

interface PrayerRequestsListProps {
  limit?: number;
  showHeader?: boolean;
}

const PrayerRequestsList: React.FC<PrayerRequestsListProps> = ({ 
  limit = 5, 
  showHeader = true 
}) => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const user = supabaseAuthService.getCurrentUser();

  const loadRequests = async () => {
    setLoading(true);
    
    try {
      if (!user || user.isGuest) {
        // For guest users, load from localStorage
        const guestRequests = JSON.parse(localStorage.getItem('guest-prayer-requests') || '[]');
        const sampleRequests: PrayerRequest[] = [
          {
            id: '1',
            title: 'Healing for my grandmother',
            description: 'Please pray for my grandmother who is in the hospital. She needs strength and healing.',
            isAnonymous: false,
            isAnswered: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            userName: 'Sarah M.',
            responseCount: 12
          },
          {
            id: '2',
            title: 'Job interview tomorrow',
            description: 'I have an important job interview tomorrow. Praying for peace and wisdom.',
            isAnonymous: true,
            isAnswered: false,
            createdAt: new Date(Date.now() - 43200000).toISOString(),
            userName: 'Anonymous',
            responseCount: 8
          },
          {
            id: '3',
            title: 'Marriage restoration',
            description: 'Please pray for healing and restoration in my marriage. We need God\'s guidance.',
            isAnonymous: false,
            isAnswered: true,
            answeredAt: new Date(Date.now() - 172800000).toISOString(),
            answerDescription: 'Thank you all for your prayers! We had a breakthrough conversation and are going to counseling together.',
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            userName: 'Mike R.',
            responseCount: 25
          }
        ];
        
        const combinedRequests = [...guestRequests, ...sampleRequests]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        
        setRequests(combinedRequests);
      } else {
        // For authenticated users, load from Supabase
        if (!supabase) {
          console.error('Supabase client not available');
          return;
        }
        
        const { data, error } = await supabase
          .from('prayer_requests')
          .select(`
            id,
            title,
            description,
            is_anonymous,
            is_answered,
            answered_at,
            answer_description,
            created_at,
            profiles!inner(full_name)
          `)
          .eq('is_public', true)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error loading prayer requests:', error);
          return;
        }

        const formattedRequests: PrayerRequest[] = data.map((req: any) => ({
          id: req.id,
          title: req.title,
          description: req.description,
          isAnonymous: req.is_anonymous,
          isAnswered: req.is_answered,
          answeredAt: req.answered_at,
          answerDescription: req.answer_description,
          createdAt: req.created_at,
          userName: req.is_anonymous ? 'Anonymous' : req.profiles.full_name,
          responseCount: 0 // Would need a separate query to count responses
        }));

        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Error loading prayer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user, limit]);

  const handlePrayForRequest = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setShowResponseForm(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {showHeader && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Heart className="text-red-600" size={20} />
              <h3 className="font-semibold text-gray-900">Community Prayer Requests</h3>
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Heart className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No prayer requests at the moment</p>
              <p className="text-sm">Be the first to share a prayer request with the community</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    {request.isAnonymous && (
                      <Lock className="text-gray-400" size={14} />
                    )}
                    {request.isAnswered && (
                      <CheckCircle className="text-green-600" size={14} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {formatTimeAgo(request.createdAt)}
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {request.description}
                </p>
                
                {request.isAnswered && request.answerDescription && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="text-green-600" size={14} />
                      <span className="text-sm font-medium text-green-800">Prayer Answered!</span>
                    </div>
                    <p className="text-sm text-green-700">{request.answerDescription}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {request.userName}</span>
                    {request.responseCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        <span>{request.responseCount} praying</span>
                      </div>
                    )}
                  </div>
                  
                  {!request.isAnswered && (
                    <button
                      onClick={() => handlePrayForRequest(request)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      <Heart size={14} />
                      Pray
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Prayer Response Form */}
      {showResponseForm && selectedRequest && (
        <PrayerResponseForm
          request={selectedRequest}
          onClose={() => {
            setShowResponseForm(false);
            setSelectedRequest(null);
          }}
          onSubmit={() => {
            loadRequests(); // Refresh the list
          }}
        />
      )}
    </>
  );
};

export default PrayerRequestsList;