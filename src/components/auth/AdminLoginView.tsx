import React, { useState } from 'react';
import { loginWithPassword, loginWithRecoveryCode } from '../../data/authService';
import { Lock, User, Eye, EyeOff, AlertCircle, Key, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onBackToHome: () => void;
}

export const AdminLoginView: React.FC<Props> = ({
  onLoginSuccess,
  onForgotPassword,
  onBackToHome,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Code Login Mode
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithPassword(username, password, rememberMe);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Invalid username or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithRecoveryCode(username, recoveryCode);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Invalid username or recovery code.');
      }
    } catch (err: any) {
      setError(err.message || 'Recovery login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 mb-1">
            A
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRecoveryMode ? 'Emergency Recovery Login' : 'Admin Studio Login'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isRecoveryMode
              ? 'Enter your administrator username and one of your single-use recovery codes.'
              : 'Enter your credentials to access the AstroPress publishing dashboard.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isRecoveryMode ? (
          /* Standard Password Form */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Username</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">Password</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <span>Remember session (30 days)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>
        ) : (
          /* Emergency Recovery Code Form */
          <form onSubmit={handleRecoveryCodeLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Admin Username</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Single-Use Recovery Code</label>
              <div className="relative">
                <Key className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. XXXX-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                This code will be marked as used immediately upon login.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              <span>{isSubmitting ? 'Verifying Code...' : 'Authenticate with Recovery Code'}</span>
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              setIsRecoveryMode(!isRecoveryMode);
              setError(null);
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isRecoveryMode ? 'Back to standard login' : 'Use emergency recovery code'}
          </button>

          <button
            type="button"
            onClick={onBackToHome}
            className="text-slate-400 hover:text-white transition-colors"
          >
            &larr; Return to Site
          </button>
        </div>
      </div>
    </div>
  );
};
