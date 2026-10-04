import React, { useState, useEffect } from 'react';
import {
  AuthPublicState,
  getAuthPublicState,
  updateAccountCredentials,
  configureBackupAdmin,
  revokeBackupAdmin,
  regenerateRecoveryCodes,
  getRecentAuditLogs,
} from '../../data/authService';
import { AuthAuditLog } from '../../types/auth';
import {
  Shield,
  Key,
  UserCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Check,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onAuthStateChange: () => void;
}

export const AccountSecurityManager: React.FC<Props> = ({ onAuthStateChange }) => {
  const [authState, setAuthState] = useState<AuthPublicState | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuthAuditLog[]>([]);

  // Profile Edit State
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPasswordForProfile, setCurrentPasswordForProfile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showProfilePass, setShowProfilePass] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Backup Admin State
  const [showBackupForm, setShowBackupForm] = useState(false);
  const [backupUsername, setBackupUsername] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupConfirmPassword, setBackupConfirmPassword] = useState('');
  const [primaryPasswordForBackup, setPrimaryPasswordForBackup] = useState('');
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingBackup, setIsSavingBackup] = useState(false);

  // Recovery Codes Modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const loadState = async () => {
    const s = await getAuthPublicState();
    setAuthState(s);
    if (s.currentUser) {
      setEditUsername(s.currentUser.username);
      setEditEmail(s.currentUser.email);
    }
    setAuditLogs(getRecentAuditLogs());
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState?.currentUser) return;
    setProfileMsg(null);
    setIsUpdatingProfile(true);

    try {
      const res = await updateAccountCredentials(authState.currentUser.id, {
        newUsername: editUsername,
        newEmail: editEmail,
        currentPassword: currentPasswordForProfile,
        newPassword: newPassword || undefined,
        confirmNewPassword: confirmNewPassword || undefined,
      });

      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Account settings and credentials updated successfully.' });
        setCurrentPasswordForProfile('');
        setNewPassword('');
        setConfirmNewPassword('');
        await loadState();
        onAuthStateChange();
      } else {
        setProfileMsg({ type: 'error', text: res.error || 'Failed to update credentials.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleConfigureBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState?.currentUser) return;
    setBackupMsg(null);
    setIsSavingBackup(true);

    try {
      const res = await configureBackupAdmin(authState.currentUser.id, {
        username: backupUsername,
        email: backupEmail,
        password: backupPassword,
        confirmPassword: backupConfirmPassword,
        currentPrimaryPassword: primaryPasswordForBackup,
      });

      if (res.success) {
        setBackupMsg({ type: 'success', text: `Backup Administrator @${backupUsername} configured successfully.` });
        setBackupPassword('');
        setBackupConfirmPassword('');
        setPrimaryPasswordForBackup('');
        setShowBackupForm(false);
        await loadState();
        onAuthStateChange();
      } else {
        setBackupMsg({ type: 'error', text: res.error || 'Failed to configure backup account.' });
      }
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.message || 'Failed to save backup administrator.' });
    } finally {
      setIsSavingBackup(false);
    }
  };

  const handleRevokeBackup = async () => {
    if (!authState?.currentUser) return;
    const pwd = prompt('Enter Primary Administrator password to revoke and disable the backup account:');
    if (!pwd) return;

    try {
      const res = await revokeBackupAdmin(authState.currentUser.id, pwd);
      if (res.success) {
        alert('Backup administrator account has been disabled and all active backup sessions terminated.');
        await loadState();
        onAuthStateChange();
      } else {
        alert(res.error || 'Failed to revoke backup administrator.');
      }
    } catch (err: any) {
      alert(err.message || 'Revocation error.');
    }
  };

  const handleRegenerateCodesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState?.currentUser) return;
    setRegenError(null);
    setIsRegenerating(true);

    try {
      const res = await regenerateRecoveryCodes(authState.currentUser.id, regenPassword);
      if (res.success && res.recoveryCodes) {
        setRegenCodes(res.recoveryCodes);
        setRegenPassword('');
        await loadState();
        onAuthStateChange();
      } else {
        setRegenError(res.error || 'Failed to regenerate codes.');
      }
    } catch (err: any) {
      setRegenError(err.message || 'Error regenerating codes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyCodes = () => {
    if (!regenCodes) return;
    navigator.clipboard.writeText(regenCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!regenCodes || !authState?.currentUser) return;
    const text = `ASTROPRESS RECOVERY CODES\n========================\nUser: ${authState.currentUser.username}\nGenerated: ${new Date().toUTCString()}\n\nSingle-use emergency codes:\n\n${regenCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n')}\n\nStore in an encrypted password vault.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astropress-recovery-codes-${authState.currentUser.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPrimary = authState?.currentUser?.role === 'primary_admin';

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-xs">
      {/* Recovery Codes Display Modal */}
      {regenCodes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">New Recovery Codes Generated</h3>
                <p className="text-xs text-slate-400">All previous recovery codes have been invalidated.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-emerald-400 font-bold">
                {regenCodes.map((code, idx) => (
                  <div key={idx} className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] mr-1.5">{idx + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCodes}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                {copiedCodes ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
                <span>{copiedCodes ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCodes}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="h-4 w-4 text-slate-300" />
                <span>Download</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegenCodes(null);
                setShowRegenModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Re-authenticate Modal to Regenerate */}
      {showRegenModal && !regenCodes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              <span>Confirm Password to Regenerate Codes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Generating a new set of 8 emergency recovery codes will permanently invalidate your existing ones.
            </p>

            {regenError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                {regenError}
              </div>
            )}

            <form onSubmit={handleRegenerateCodesSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegenModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegenerating}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isRegenerating ? 'Generating...' : 'Generate New Codes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Security & Administrator Accounts</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage administrator authentication, password credentials, single-use recovery codes, and optional backup access.
        </p>
      </div>

      {/* Section 1: Administrator Profile & Password */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {authState?.currentUser?.role === 'primary_admin' ? 'Primary Administrator' : 'Backup Administrator'}
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-2">Account Profile & Password</h2>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Status: Active</span>
            <span className="text-[11px] text-slate-400 block font-mono">
              Last login: {authState?.currentUser?.lastLoginAt ? new Date(authState.currentUser.lastLoginAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          {profileMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Username</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Recovery Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">New Password (leave blank to keep current)</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showProfilePass ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowProfilePass(!showProfilePass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showProfilePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showProfilePass ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="max-w-xs space-y-1">
              <label className="text-xs font-bold text-slate-900">
                Confirm Current Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Current password"
                value={currentPasswordForProfile}
                onChange={(e) => setCurrentPasswordForProfile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Account Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Emergency Recovery Codes */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Emergency Recovery Codes</h2>
            </div>
            <p className="text-xs text-slate-500">
              Single-use backup keys stored as cryptographic hashes to recover your account if password and email are lost.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              {authState?.remainingRecoveryCodesCount ?? 0} Unused Codes Remaining
            </span>
            <button
              type="button"
              onClick={() => setShowRegenModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate Codes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Optional Backup Administrator (Primary Admin Only) */}
      {isPrimary && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">Optional Backup Administrator</h2>
              </div>
              <p className="text-xs text-slate-500">
                Grant secondary administrative access to one trusted backup administrator for emergencies or editorial support.
              </p>
            </div>
            <div>
              {authState?.hasBackupAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                    Active: @{authState.backupAdminUsername}
                  </span>
                  <button
                    type="button"
                    onClick={handleRevokeBackup}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Disable Account</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBackupForm(!showBackupForm)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                >
                  {showBackupForm ? 'Cancel' : '+ Configure Backup Administrator'}
                </button>
              )}
            </div>
          </div>

          {showBackupForm && (
            <form onSubmit={handleConfigureBackup} className="p-6 bg-slate-50/50 space-y-4">
              {backupMsg && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                    backupMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {backupMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{backupMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Backup Admin Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. backup_admin"
                    value={backupUsername}
                    onChange={(e) => setBackupUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Backup Admin Recovery Email</label>
                  <input
                    type="email"
                    required
                    placeholder="backup.admin@example.com"
                    value={backupEmail}
                    onChange={(e) => setBackupEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Backup Admin Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm Backup Admin Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Repeat password"
                    value={backupConfirmPassword}
                    onChange={(e) => setBackupConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 max-w-xs space-y-1">
                <label className="text-xs font-bold text-slate-900">
                  Primary Admin Password Confirmation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Your current primary admin password"
                  value={primaryPasswordForBackup}
                  onChange={(e) => setPrimaryPasswordForBackup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingBackup}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSavingBackup ? 'Configuring Account...' : 'Authorize & Enable Backup Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Section 4: Security Audit Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recent Security Audit Logs</h2>
          </div>
          <span className="text-[11px] text-slate-400">Showing last {auditLogs.length} events</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No security events recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto font-mono text-[11px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        log.success ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-bold text-slate-800 font-sans">{log.action}</span>
                  </div>
                  <p className="text-slate-500 font-sans text-xs">{log.details}</p>
                </div>
                <span className="text-slate-400 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
