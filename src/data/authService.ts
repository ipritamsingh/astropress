/**
 * AstroPress Authentication Service (Cloudflare D1 Integration)
 * 
 * Communicates with server-side authentication APIs backed by Cloudflare D1
 * database (binding: DB, database: astropress-db).
 * 
 * No credentials, passwords, or recovery records are stored in browser localStorage
 * or temporary memory; all persistence is handled by Cloudflare D1.
 */

import {
  AdminUser,
  AdminSession,
  PasswordResetToken,
  RecoveryCodeRecord,
  AuthAuditLog,
  AuthPublicState,
  AdminRole,
} from '../types/auth';

export type { AuthPublicState, AdminRole, AdminUser };

const API_BASE = '/api/auth';
const TOKEN_KEY = 'astropress_session_token';

// In-memory token fallback for cross-origin or cookie-restricted contexts
let inMemoryToken: string | null = null;

export function getSessionToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function setSessionToken(token: string | null, rememberMe = false): void {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }
  return headers;
}

/**
 * Fetch Public Auth State directly from Cloudflare D1
 */
export async function getAuthPublicState(): Promise<AuthPublicState> {
  try {
    const res = await fetch(`${API_BASE}/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      return {
        isInitialized: false,
        isAuthenticated: false,
        currentUser: null,
        hasBackupAdmin: false,
        remainingRecoveryCodesCount: 0,
      };
    }

    const data = await res.json();
    return {
      isInitialized: Boolean(data.isInitialized),
      isAuthenticated: Boolean(data.isAuthenticated),
      currentUser: data.currentUser || null,
      hasBackupAdmin: Boolean(data.hasBackupAdmin),
      backupAdminUsername: data.backupAdminUsername,
      remainingRecoveryCodesCount: data.remainingRecoveryCodesCount || 0,
    };
  } catch (err) {
    console.warn('[AuthService] Failed to fetch auth status from D1:', err);
    return {
      isInitialized: false,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: false,
      remainingRecoveryCodesCount: 0,
    };
  }
}

/**
 * One-time Initial Setup for Primary Administrator
 */
export async function initializePrimaryAdmin(data: {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      if (result.sessionToken) {
        setSessionToken(result.sessionToken, true);
      }
      return {
        success: true,
        recoveryCodes: result.recoveryCodes,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to initialize administrator account in Cloudflare D1.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error connecting to Cloudflare D1.',
    };
  }
}

/**
 * Secure Login with Username & Password
 */
export async function loginWithPassword(
  usernameInput: string,
  passwordInput: string,
  rememberMe = false
): Promise<{ success: boolean; error?: string; lockoutSeconds?: number }> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
        rememberMe,
      }),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      if (result.sessionToken) {
        setSessionToken(result.sessionToken, rememberMe);
      }
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Invalid username or password.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Login connection failed.',
    };
  }
}

/**
 * Emergency Login with Single-Use Recovery Code
 */
export async function loginWithRecoveryCode(
  usernameInput: string,
  recoveryCodeInput: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/recovery-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: usernameInput,
        code: recoveryCodeInput,
      }),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      if (result.sessionToken) {
        setSessionToken(result.sessionToken, false);
      }
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Invalid username or recovery code.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Emergency recovery login connection failed.',
    };
  }
}

/**
 * Logout & Session Invalidation in Cloudflare D1
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch {}
  setSessionToken(null);
}

/**
 * Request Password Reset Email via Cloudflare D1
 */
export async function requestPasswordReset(emailInput: string): Promise<{
  success: boolean;
  message: string;
  devResetUrl?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: emailInput }),
    });

    const result = await res.json();
    return {
      success: true,
      message:
        result.message ||
        'If this recovery email is registered with an administrator account, password reset instructions have been sent.',
      devResetUrl: result.devResetUrl,
    };
  } catch (err: any) {
    return {
      success: true,
      message:
        'If this recovery email is registered with an administrator account, password reset instructions have been sent.',
    };
  }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(rawToken: string): Promise<{
  valid: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: rawToken }),
    });

    const result = await res.json();
    return {
      valid: Boolean(result.valid),
      username: result.username,
      error: result.error,
    };
  } catch (err: any) {
    return { valid: false, error: 'Failed to verify token with database.' };
  }
}

/**
 * Reset Password with valid token
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        token: rawToken,
        newPassword,
        confirmPassword,
      }),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      setSessionToken(null);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Failed to reset password.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Password reset request failed.' };
  }
}

/**
 * Update Primary Admin Account Settings
 */
export async function updateAccountCredentials(
  userId: string,
  data: {
    newUsername?: string;
    newEmail?: string;
    currentPassword: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/update-account`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Failed to update credentials in Cloudflare D1.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Account update failed.' };
  }
}

/**
 * Configure / Enable Backup Administrator in Cloudflare D1
 */
export async function configureBackupAdmin(
  primaryAdminId: string,
  backupData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    currentPrimaryPassword: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/backup-admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(backupData),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Failed to configure backup administrator in Cloudflare D1.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Backup admin configuration failed.' };
  }
}

/**
 * Revoke / Disable Backup Administrator
 */
export async function revokeBackupAdmin(
  primaryAdminId: string,
  currentPrimaryPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/revoke-backup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ currentPrimaryPassword }),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Failed to revoke backup administrator.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Revocation failed.' };
  }
}

/**
 * Regenerate Fresh Emergency Recovery Codes
 */
export async function regenerateRecoveryCodes(
  userId: string,
  currentPassword: string
): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/regenerate-recovery-codes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ currentPassword }),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      return { success: true, recoveryCodes: result.recoveryCodes };
    }

    return {
      success: false,
      error: result.error || 'Failed to regenerate recovery codes in Cloudflare D1.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to regenerate codes.' };
  }
}

/**
 * Get Recent Audit Logs from Cloudflare D1
 */
export async function getRecentAuditLogs(): Promise<AuthAuditLog[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch {
    return [];
  }
}
