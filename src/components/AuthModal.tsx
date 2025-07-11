import React, { useState } from 'react';
import { X, User, Mail, Lock, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { supabaseAuthService as authService } from '../services/SupabaseAuthService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'guest' | 'upgrade' | 'forgot-password';
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode: initialMode, onSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setError('');
    setSuccessMessage('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      switch (mode) {

        case 'signup':
          if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
            throw new Error('Please fill in all fields');
          }
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          await authService.signUp(formData.email, formData.password, formData.name);
          break;

        case 'signin':
          if (!formData.email.trim() || !formData.password) {
            throw new Error('Please enter email and password');
          }
          await authService.signIn(formData.email, formData.password);
          break;

        case 'upgrade':
          if (!formData.email.trim() || !formData.password) {
            throw new Error('Please enter email and password');
          }
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          await authService.upgradeToMember(formData.email, formData.password);
          break;

        case 'forgot-password':
          if (!formData.email.trim()) {
            throw new Error('Please enter your email address');
          }
          await authService.resetPassword(formData.email);
          setSuccessMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
          return; // Don't call onSuccess for password reset
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('🚨 Auth Error Details:', err);
      let errorMessage = 'An error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('🚨 Error message:', errorMessage);
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. If you haven\'t created an account yet, please sign up first.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          errorMessage = 'Too many email attempts. Please wait a few minutes before trying again.';
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'signin': return 'Sign In';
      case 'upgrade': return 'Upgrade to Member Account';
      case 'forgot-password': return 'Reset Password';
      default: return 'Authentication';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'signup': return <UserPlus size={24} />;
      case 'signin': return <LogIn size={24} />;
      case 'upgrade': return <UserPlus size={24} />;
      case 'forgot-password': return <KeyRound size={24} />;
      default: return <User size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                {getIcon()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            {mode === 'signup' && (
              <p className="text-gray-600">
                Create a member account to sync your devotions across all your devices and never lose your spiritual journey.
              </p>
            )}
            {mode === 'signin' && (
              <p className="text-gray-600">
                Welcome back! Sign in to access your devotions from any device.
              </p>
            )}
            {mode === 'upgrade' && (
              <p className="text-gray-600">
                Upgrade to a member account to sync your devotions across devices and backup your spiritual journey.
              </p>
            )}
            {mode === 'forgot-password' && (
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            {(mode === 'signin' || mode === 'signup' || mode === 'upgrade' || mode === 'forgot-password') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors hover:border-gray-400"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            {(mode === 'signin' || mode === 'signup' || mode === 'upgrade') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors hover:border-gray-400"
                    required
                  />
                </div>
                {(mode === 'signup' || mode === 'upgrade') && (
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                )}
              </div>
            )}

            {/* Confirm Password field */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors hover:border-gray-400"
                    required
                  />
                </div>
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Primary Action Buttons */}
            {mode === 'signin' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {getIcon()}
                    Sign In
                  </>
                )}
              </button>
            )}

            {mode === 'signup' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    {getIcon()}
                    Create Account
                  </>
                )}
              </button>
            )}

            {mode === 'upgrade' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    {getIcon()}
                    Upgrade Account
                  </>
                )}
              </button>
            )}

            {mode === 'forgot-password' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    {getIcon()}
                    Send Reset Email
                  </>
                )}
              </button>
            )}

            {/* Forgot Password Link - Only show on signin */}
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>

          {/* Create Account Section - Prominent but Secondary */}
          {mode === 'signin' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-700 mb-4 font-medium">New user? Create an account</p>
                <button
                  onClick={() => setMode('signup')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-700 mb-4 font-medium">Already have an account?</p>
                <button
                  onClick={() => setMode('signin')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {mode === 'forgot-password' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-700 mb-4 font-medium">Remember your password?</p>
                <button
                  onClick={() => setMode('signin')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}


          {/* Benefits */}
          {mode !== 'upgrade' && mode !== 'forgot-password' && mode !== 'guest' && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Member Benefits:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sync across all your devices</li>
                <li>• Automatic cloud backup</li>
                <li>• Never lose your spiritual journey</li>
                <li>• Enhanced sharing features</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;