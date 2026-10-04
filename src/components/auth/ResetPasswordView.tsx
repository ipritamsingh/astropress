import React, { useState, useEffect } from 'react';
import { verifyResetToken, resetPasswordWithToken } from '../../data/authService';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

interface Props {
  token: string;
  onResetSuccess: () => void;
  onBackToLogin: () => void;
}

export const ResetPasswordView: React.FC<Props> = ({ token, onResetSuccess, onBackToLogin }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function checkToken() {
      setIsVerifying(true);
      const res = await verifyResetToken(token);
      if (res.valid && res.username) {
        setTargetUsername(res.username);
        setTokenError(null);
      } else {
        setTokenError(res.error || 'Password reset link is invalid or expired.');
      }
      setIsVerifying(false);
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await resetPasswordWithToken(token, newPassword, confirmPassword);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setFormError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 items-center justify-center text-blue-400 font-bold text-xl mb-1">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set New Password</h1>
          {targetUsername && (
            <p className="text-xs text-slate-400">
              Updating credentials for administrator <strong>@{targetUsername}</strong>
            </p>
          )}
        </div>

        {isVerifying ? (
          <div className="text-center py-6 space-y-3">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate-400">Verifying cryptographic reset token...</p>
          </div>
        ) : tokenError ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              Return to Login
            </button>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Password Reset Successfully</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Your password has been changed. All prior active sessions have been invalidated for security. Please log in with your new credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetSuccess}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In with New Password</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">New Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Updating Password...' : 'Save New Password & Invalidate Sessions'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
