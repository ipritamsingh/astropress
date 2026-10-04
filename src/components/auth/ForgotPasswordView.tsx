import React, { useState } from 'react';
import { requestPasswordReset } from '../../data/authService';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  onBackToLogin: () => void;
}

export const ForgotPasswordView: React.FC<Props> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      if (result.devResetUrl) {
        setDevResetUrl(result.devResetUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset request.');
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
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Recovery</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Enter the recovery email address registered with your administrator account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Reset Request Dispatched</span>
              </div>
              <p className="leading-relaxed text-[11px] text-emerald-200/90">{message}</p>
            </div>

            {/* Development & Sandbox Direct Link Inspector */}
            {devResetUrl && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                <span className="text-slate-400 font-semibold block">Development Reset Link (15 min expiry):</span>
                <a
                  href={devResetUrl}
                  className="block font-mono text-blue-400 text-[10px] break-all hover:underline bg-slate-900 p-2 rounded-lg border border-slate-800"
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Registered Recovery Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                A single-use, 15-minute password reset link will be sent to this address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Sending Link...' : 'Send Password Reset Link'}</span>
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
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
