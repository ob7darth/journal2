import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  planName: string;
  currentDay: number;
  totalDays: number;
  user?: any;
  onUserClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ planName, currentDay, totalDays, user, onUserClick }) => {
  const progress = (currentDay / totalDays) * 100;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/dove icon.png" 
                alt="Life Journal" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Life Journal Daily Devotions</h1>
              <p className="text-sm text-gray-600">{planName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Day {currentDay} of {totalDays}</p>
              <p className="text-xs text-gray-500">{Math.round(progress)}% Complete</p>
            </div>
            
            {/* User Profile Button */}
            {user && (
              <button
                onClick={onUserClick}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title={`View Profile - ${user.name}`}
                aria-label={`View profile for ${user.name}`}
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="text-primary-600" size={16} aria-hidden="true" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.isGuest ? 'Guest' : 'Member'}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;