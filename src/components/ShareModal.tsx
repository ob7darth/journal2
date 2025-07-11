import React, { useState } from 'react';
import { X, Share2, Copy, Facebook, Twitter, Mail, MessageCircle } from 'lucide-react';
import { SOAPEntry } from '../types/SOAPEntry';

interface ShareModalProps {
  entry: SOAPEntry;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ entry, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Day ${entry.day} SOAP Study${entry.title ? ` - ${entry.title}` : ''}

📖 Scripture: ${entry.scripture}

👁️ Observation: ${entry.observation}

🎯 Application: ${entry.application}

🙏 Prayer: ${entry.prayer}

#LifeJournal #SOAPStudy #BibleStudy`;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const url = window.location.href;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=My Life Journal Study - Day ${entry.day}${entry.title ? ` - ${entry.title}` : ''}&body=${encodedText}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodedText}`, '_blank');
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Share2 size={20} />
              Share Your Life Journal Study
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                Day {entry.day}{entry.title ? ` - ${entry.title}` : ''} Preview:
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                {entry.title && (
                  <div>
                    <span className="font-medium">📝 Title:</span>
                    <p className="mt-1">{entry.title}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">📖 Scripture:</span>
                  <p className="mt-1">{entry.scripture}</p>
                </div>
                <div>
                  <span className="font-medium">👁️ Observation:</span>
                  <p className="mt-1">{entry.observation.substring(0, 100)}...</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyToClipboard}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed transition-colors ${
                copied 
                  ? 'border-green-300 bg-green-50 text-green-700' 
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <Copy size={18} />
              {copied ? 'Copied to Clipboard!' : 'Copy Full Text'}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Share on:</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook size={18} />
                Facebook
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Twitter size={18} />
                Twitter
              </button>
              
              <button
                onClick={() => handleShare('email')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Mail size={18} />
                Email
              </button>
              
              <button
                onClick={() => handleShare('sms')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={18} />
                SMS
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Sharing helps encourage others in their faith journey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;