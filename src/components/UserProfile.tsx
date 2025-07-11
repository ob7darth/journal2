import React, { useState } from 'react';
import { User, LogOut, Upload, Shield, Calendar, Award } from 'lucide-react';
import { supabaseAuthService as authService } from '../services/SupabaseAuthService';
import AuthModal from './AuthModal';

interface UserProfileProps {
  user: any;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await authService.signOut();
      onClose();
    }
  };

  const handleSync = async () => {
    if (user.isGuest) return;
    
    setSyncing(true);
    try {
      await authService.syncData();
      alert('Data synced successfully!');
    } catch (error) {
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-primary-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              {user.email && (
                <p className="text-gray-600">{user.email}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                {user.isGuest ? (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Guest User
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Member
                  </span>
                )}
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Calendar className="text-primary-600 mx-auto mb-2" size={20} />
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Award className="text-primary-600 mx-auto mb-2" size={20} />
                <p className="text-sm text-gray-600">Last Active</p>
                <p className="font-semibold text-gray-900">{formatDate(user.lastLogin)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {user.isGuest && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Upload size={18} />
                  Upgrade to Member Account
                </button>
              )}

              {!user.isGuest && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {syncing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Sync Data
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>

            {/* Account Type Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                {user.isGuest ? 'Guest Account' : 'Member Account'}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {user.isGuest ? (
                  <>
                    <li>• Data stored locally on this device</li>
                    <li>• All features available</li>
                    <li>• Upgrade anytime to sync across devices</li>
                  </>
                ) : (
                  <>
                    <li>• Data synced across all devices</li>
                    <li>• Automatic cloud backup</li>
                    <li>• Enhanced sharing features</li>
                    <li>• Never lose your devotional journey</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <AuthModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          mode="upgrade"
          onSuccess={() => {
            setShowUpgradeModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default UserProfile;