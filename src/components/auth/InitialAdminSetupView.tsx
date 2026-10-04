import React, { useState } from 'react';
import { initializePrimaryAdmin } from '../../data/authService';
import { ShieldCheck, Lock, User, Mail, Key, Eye, EyeOff, AlertCircle, CheckCircle2, Download, Copy, Check } from 'lucide-react';

interface Props {
  onSetupComplete: () => void;
}

export const InitialAdminSetupView: React.FC<Props> = ({ onSetupComplete }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await initializePrimaryAdmin({
        username,
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        setError(result.error || 'Failed to initialize administrator account.');
        setIsSubmitting(false);
        return;
      }

      if (result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
      } else {
        onSetupComplete();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!recoveryCodes) return;
    const text = `ASTROPRESS EMERGENCY RECOVERY CODES\n===================================\nUsername: ${username}\nRecovery Email: ${email}\nGenerated: ${new Date().toUTCString()}\n\nEach code can be used ONLY ONCE for emergency access:\n\n${recoveryCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n')}\n\nKeep this file in a secure, encrypted password manager.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astropress-recovery-codes-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      {/* Recovery Codes Modal (Shown right after setup) */}
      {recoveryCodes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Save Emergency Recovery Codes</h3>
                <p className="text-xs text-slate-400">These 8 codes provide one-time emergency access if you ever lose your credentials.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-emerald-400 font-bold">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800/80 text-center">
                    <span className="text-slate-500 text-[10px] mr-1.5">{idx + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-amber-300/90 leading-relaxed bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl">
              <strong>Crucial:</strong> These codes are stored exclusively as cryptographic hashes. They will <strong>never be shown again</strong>. Download or copy them now.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCodes}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                {copiedCodes ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
                <span>{copiedCodes ? 'Copied to Clipboard' : 'Copy Codes'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCodes}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="h-4 w-4 text-slate-300" />
                <span>Download .txt</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onSetupComplete}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>I have securely saved my codes &rarr; Open Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Setup Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 mb-1">
            A
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Initial Admin Setup</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Configure your personal Primary Administrator account. This route permanently locks after setup.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Admin Username <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={3}
                placeholder="e.g. admin or your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Recovery Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Recovery Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-500">Used for password resets and critical account alerts.</p>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Admin Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="At least 8 characters"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Repeat password"
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
            <span>{isSubmitting ? 'Establishing Security...' : 'Initialize Administrator Account'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-500">
            PBKDF2 SHA-256 (100,000 rounds) • Zero hardcoded credentials • Cloudflare D1 Ready
          </span>
        </div>
      </div>
    </div>
  );
};
