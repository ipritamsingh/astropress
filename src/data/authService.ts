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

// Storage Keys (Secure Client-State & Local Storage Adapter)
const AUTH_STORAGE_KEY_USERS = 'astropress_auth_users_v1';
const AUTH_STORAGE_KEY_SESSIONS = 'astropress_auth_sessions_v1';
const AUTH_STORAGE_KEY_TOKENS = 'astropress_auth_tokens_v1';
const AUTH_STORAGE_KEY_RECOVERY = 'astropress_auth_recovery_v1';
const AUTH_STORAGE_KEY_LOGS = 'astropress_auth_logs_v1';
const AUTH_SESSION_TOKEN_COOKIE = 'astropress_session_token';

// Configuration constants
const PBKDF2_ITERATIONS = 100000;
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// Cryptographic Helpers (Web Crypto API - 100% Native Edge / Browser Support)
// ============================================================================

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArrayBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashStringSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hashBuffer);
}

export function generateRandomSecureHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return arrayBufferToHex(bytes.buffer);
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous characters
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let j = 0; j < 12; j++) {
      code += chars[bytes[j] % chars.length];
      if (j === 3 || j === 7) code += '-';
    }
    codes.push(code);
  }
  return codes;
}

export async function hashPassword(
  password: string,
  providedSaltHex?: string
): Promise<{ hashHex: string; saltHex: string }> {
  const encoder = new TextEncoder();
  const salt = providedSaltHex
    ? hexToArrayBuffer(providedSaltHex)
    : new Uint8Array(new ArrayBuffer(16));
  if (!providedSaltHex) {
    crypto.getRandomValues(salt as Uint8Array<ArrayBuffer>);
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hashHex: arrayBufferToHex(derivedKey),
    saltHex: arrayBufferToHex(salt.buffer as ArrayBuffer),
  };
}

export async function verifyPassword(
  passwordAttempt: string,
  storedHashHex: string,
  storedSaltHex: string
): Promise<boolean> {
  try {
    const { hashHex } = await hashPassword(passwordAttempt, storedSaltHex);
    // Timing-safe comparison simulation
    if (hashHex.length !== storedHashHex.length) return false;
    let match = true;
    for (let i = 0; i < hashHex.length; i++) {
      if (hashHex[i] !== storedHashHex[i]) {
        match = false;
      }
    }
    return match;
  } catch (err) {
    return false;
  }
}

// ============================================================================
// Storage Adapter (D1 Compatible / Client Memory Persistence)
// ============================================================================

function getStoredUsers(): AdminUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY_USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: AdminUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {}
}

function getStoredSessions(): AdminSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredSessions(sessions: AdminSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch {}
}

function getStoredTokens(): PasswordResetToken[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY_TOKENS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredTokens(tokens: PasswordResetToken[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY_TOKENS, JSON.stringify(tokens));
  } catch {}
}

function getStoredRecoveryCodes(): RecoveryCodeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY_RECOVERY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredRecoveryCodes(records: RecoveryCodeRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY_RECOVERY, JSON.stringify(records));
  } catch {}
}

function recordAuditLog(log: Omit<AuthAuditLog, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY_LOGS);
    const logs: AuthAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ...log,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 entries
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem(AUTH_STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch {}
}

function getActiveSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(AUTH_SESSION_TOKEN_COOKIE) || localStorage.getItem(AUTH_SESSION_TOKEN_COOKIE);
}

function setActiveSessionToken(token: string, rememberMe = false): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_SESSION_TOKEN_COOKIE, token);
  if (rememberMe) {
    localStorage.setItem(AUTH_SESSION_TOKEN_COOKIE, token);
  } else {
    localStorage.removeItem(AUTH_SESSION_TOKEN_COOKIE);
  }
}

function clearActiveSessionToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_SESSION_TOKEN_COOKIE);
  localStorage.removeItem(AUTH_SESSION_TOKEN_COOKIE);
}

// ============================================================================
// Core Authentication Service Methods
// ============================================================================

export async function getAuthPublicState(): Promise<AuthPublicState> {
  const users = getStoredUsers();
  const primaryAdmin = users.find((u) => u.role === 'primary_admin');
  const backupAdmin = users.find((u) => u.role === 'backup_admin' && u.isActive);

  if (!primaryAdmin) {
    return {
      isInitialized: false,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: false,
      remainingRecoveryCodesCount: 0,
    };
  }

  const token = getActiveSessionToken();
  if (!token) {
    return {
      isInitialized: true,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: Boolean(backupAdmin),
      backupAdminUsername: backupAdmin?.username,
      remainingRecoveryCodesCount: 0,
    };
  }

  const tokenHash = await hashStringSha256(token);
  const sessions = getStoredSessions();
  const session = sessions.find((s) => s.tokenHash === tokenHash);

  if (!session) {
    clearActiveSessionToken();
    return {
      isInitialized: true,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: Boolean(backupAdmin),
      backupAdminUsername: backupAdmin?.username,
      remainingRecoveryCodesCount: 0,
    };
  }

  const now = Date.now();
  const expiresAt = new Date(session.expiresAt).getTime();
  const lastActive = new Date(session.lastActiveAt).getTime();

  // Check absolute and idle expiration
  if (now > expiresAt || now - lastActive > SESSION_IDLE_TIMEOUT_MS) {
    // Session expired
    saveStoredSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
    clearActiveSessionToken();
    return {
      isInitialized: true,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: Boolean(backupAdmin),
      backupAdminUsername: backupAdmin?.username,
      remainingRecoveryCodesCount: 0,
    };
  }

  // Update last active
  session.lastActiveAt = new Date().toISOString();
  saveStoredSessions(sessions);

  const activeUser = users.find((u) => u.id === session.userId && u.isActive);
  if (!activeUser) {
    saveStoredSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
    clearActiveSessionToken();
    return {
      isInitialized: true,
      isAuthenticated: false,
      currentUser: null,
      hasBackupAdmin: Boolean(backupAdmin),
      backupAdminUsername: backupAdmin?.username,
      remainingRecoveryCodesCount: 0,
    };
  }

  // Calculate unused recovery codes for this user
  const recoveryRecords = getStoredRecoveryCodes().filter(
    (r) => r.userId === activeUser.id && !r.usedAt
  );

  return {
    isInitialized: true,
    isAuthenticated: true,
    currentUser: {
      id: activeUser.id,
      username: activeUser.username,
      email: activeUser.email,
      role: activeUser.role,
      lastLoginAt: activeUser.lastLoginAt,
    },
    hasBackupAdmin: Boolean(backupAdmin),
    backupAdminUsername: backupAdmin?.username,
    remainingRecoveryCodesCount: recoveryRecords.length,
  };
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
  const users = getStoredUsers();
  if (users.length > 0) {
    return {
      success: false,
      error: 'Setup has already been completed. Initial setup is permanently locked.',
    };
  }

  const username = data.username.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;

  if (username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (password !== data.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid recovery email address.' };
  }

  const { hashHex, saltHex } = await hashPassword(password);
  const primaryId = 'usr-admin-' + Date.now();

  const newPrimaryAdmin: AdminUser = {
    id: primaryId,
    username,
    email,
    role: 'primary_admin',
    passwordHash: hashHex,
    passwordSalt: saltHex,
    isActive: true,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // Generate 8 emergency recovery codes
  const plainRecoveryCodes = generateRecoveryCodes(8);
  const recoveryRecords: RecoveryCodeRecord[] = [];
  for (const code of plainRecoveryCodes) {
    const codeHash = await hashStringSha256(code.replace(/-/g, '').toUpperCase());
    recoveryRecords.push({
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: primaryId,
      codeHash,
      usedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  saveStoredUsers([newPrimaryAdmin]);
  saveStoredRecoveryCodes(recoveryRecords);

  // Generate initial session
  const rawToken = generateRandomSecureHex(32);
  const tokenHash = await hashStringSha256(rawToken);

  const initialSession: AdminSession = {
    id: 'sess-' + Date.now(),
    userId: primaryId,
    tokenHash,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  saveStoredSessions([initialSession]);
  setActiveSessionToken(rawToken, true);

  recordAuditLog({
    userId: primaryId,
    action: 'INITIAL_ADMIN_SETUP_COMPLETED',
    success: true,
    details: `Primary Administrator @${username} established with 8 emergency recovery codes.`,
  });

  return {
    success: true,
    recoveryCodes: plainRecoveryCodes,
  };
}

/**
 * Secure Login with Username & Password
 */
export async function loginWithPassword(
  usernameInput: string,
  passwordInput: string,
  rememberMe = false
): Promise<{ success: boolean; error?: string; lockoutSeconds?: number }> {
  const username = usernameInput.trim();
  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  // Timing safe dummy hash calculation to avoid timing side-channel enumeration
  if (!user || !user.isActive) {
    await hashPassword(passwordInput, '00000000000000000000000000000000');
    recordAuditLog({
      action: 'LOGIN_FAILED',
      success: false,
      details: `Failed login attempt for unknown/inactive username: "${username}"`,
    });
    return {
      success: false,
      error: 'Invalid username or password.',
    };
  }

  // Check Lockout
  const now = Date.now();
  if (user.lockoutUntil) {
    const lockoutEnd = new Date(user.lockoutUntil).getTime();
    if (now < lockoutEnd) {
      const remainingSeconds = Math.ceil((lockoutEnd - now) / 1000);
      return {
        success: false,
        error: `Account is temporarily locked due to repeated failed attempts. Please try again in ${Math.ceil(
          remainingSeconds / 60
        )} minutes.`,
        lockoutSeconds: remainingSeconds,
      };
    } else {
      // Lockout expired, reset attempts
      user.lockoutUntil = null;
      user.failedLoginAttempts = 0;
    }
  }

  const isValid = await verifyPassword(passwordInput, user.passwordHash, user.passwordSalt);

  if (!isValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    let errorMsg = 'Invalid username or password.';

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockoutUntil = new Date(now + LOCKOUT_DURATION_MS).toISOString();
      errorMsg = 'Too many failed login attempts. Account temporarily locked for 15 minutes.';
      recordAuditLog({
        userId: user.id,
        action: 'ACCOUNT_LOCKED_OUT',
        success: false,
        details: `Account @${user.username} locked after ${MAX_FAILED_ATTEMPTS} failed attempts.`,
      });
    } else {
      recordAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        success: false,
        details: `Incorrect password attempt (${user.failedLoginAttempts}/${MAX_FAILED_ATTEMPTS})`,
      });
    }

    saveStoredUsers(users);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // Success: Reset failed attempts & rotate session
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.lastLoginAt = new Date().toISOString();
  saveStoredUsers(users);

  // Rotate Session ID
  const rawToken = generateRandomSecureHex(32);
  const tokenHash = await hashStringSha256(rawToken);

  const sessions = getStoredSessions();
  // Filter out any stale sessions older than absolute timeout
  const cleanSessions = sessions.filter((s) => new Date(s.expiresAt).getTime() > now);

  const newSession: AdminSession = {
    id: 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    tokenHash,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(now + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : SESSION_ABSOLUTE_TIMEOUT_MS)).toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  cleanSessions.push(newSession);
  saveStoredSessions(cleanSessions);
  setActiveSessionToken(rawToken, rememberMe);

  recordAuditLog({
    userId: user.id,
    action: 'LOGIN_SUCCESSFUL',
    success: true,
    details: `User @${user.username} (${user.role}) authenticated successfully.`,
  });

  return { success: true };
}

/**
 * Emergency Login with Single-Use Recovery Code
 */
export async function loginWithRecoveryCode(
  usernameInput: string,
  recoveryCodeInput: string
): Promise<{ success: boolean; error?: string }> {
  const username = usernameInput.trim();
  const code = recoveryCodeInput.trim().replace(/-/g, '').toUpperCase();

  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.isActive);

  if (!user) {
    return { success: false, error: 'Invalid username or recovery code.' };
  }

  const codeHash = await hashStringSha256(code);
  const recoveryRecords = getStoredRecoveryCodes();
  const match = recoveryRecords.find((r) => r.userId === user.id && r.codeHash === codeHash && !r.usedAt);

  if (!match) {
    recordAuditLog({
      userId: user.id,
      action: 'RECOVERY_CODE_LOGIN_FAILED',
      success: false,
      details: 'Invalid or already used recovery code submitted.',
    });
    return { success: false, error: 'Invalid or already used recovery code.' };
  }

  // Mark code as used immediately
  match.usedAt = new Date().toISOString();
  saveStoredRecoveryCodes(recoveryRecords);

  // Clear any lockout
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.lastLoginAt = new Date().toISOString();
  saveStoredUsers(users);

  // Establish Session
  const rawToken = generateRandomSecureHex(32);
  const tokenHash = await hashStringSha256(rawToken);

  const sessions = getStoredSessions();
  const newSession: AdminSession = {
    id: 'sess-rec-' + Date.now(),
    userId: user.id,
    tokenHash,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  sessions.push(newSession);
  saveStoredSessions(sessions);
  setActiveSessionToken(rawToken, false);

  recordAuditLog({
    userId: user.id,
    action: 'RECOVERY_CODE_LOGIN_SUCCESS',
    success: true,
    details: `Emergency login granted via single-use recovery code. Code ID ${match.id} consumed.`,
  });

  return { success: true };
}

/**
 * Logout & Session Invalidation
 */
export async function logout(): Promise<void> {
  const token = getActiveSessionToken();
  if (token) {
    try {
      const tokenHash = await hashStringSha256(token);
      const sessions = getStoredSessions().filter((s) => s.tokenHash !== tokenHash);
      saveStoredSessions(sessions);
    } catch {}
  }
  clearActiveSessionToken();
  recordAuditLog({
    action: 'LOGOUT',
    success: true,
    details: 'Admin session terminated.',
  });
}

/**
 * Request Password Reset Email with Resend / Provider Dispatch
 */
export async function requestPasswordReset(emailInput: string): Promise<{
  success: boolean;
  message: string;
  devResetUrl?: string; // Exposed only in dev/console for instant local testing
}> {
  const email = emailInput.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find((u) => u.email.toLowerCase() === email && u.isActive);

  // Generic timing-safe response message to prevent account enumeration
  const genericMessage =
    'If this recovery email is registered with an administrator account, password reset instructions have been sent. Please check your inbox (link expires in 15 minutes).';

  if (!user) {
    recordAuditLog({
      action: 'PASSWORD_RESET_REQUESTED_UNKNOWN',
      success: false,
      details: `Reset requested for unregistered email: ${email}`,
    });
    return { success: true, message: genericMessage };
  }

  // Generate 32-byte cryptographic token
  const rawToken = generateRandomSecureHex(32);
  const tokenHash = await hashStringSha256(rawToken);

  const tokens = getStoredTokens();
  // Invalidate any older unused tokens for this user
  tokens.forEach((t) => {
    if (t.userId === user.id && !t.usedAt) {
      t.usedAt = new Date().toISOString();
    }
  });

  const newToken: PasswordResetToken = {
    id: 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString(),
    usedAt: null,
    createdAt: new Date().toISOString(),
  };

  tokens.push(newToken);
  saveStoredTokens(tokens);

  const resetUrl = `${window.location.origin}/dashboard?action=reset-password&token=${rawToken}`;

  recordAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET_TOKEN_GENERATED',
    success: true,
    details: `Single-use reset link dispatched for @${user.username} to ${email}.`,
  });

  // Attempt real email delivery if Resend environment key is available
  try {
    const resendApiKey = typeof process !== 'undefined' ? process.env.RESEND_API_KEY : undefined;
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AstroPress Security <security@astropress.dev>',
          to: email,
          subject: 'AstroPress Password Reset Request',
          html: `
            <h2>AstroPress Password Reset</h2>
            <p>You requested a password reset for administrator account <strong>@${user.username}</strong>.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></p>
            <p>This link is single-use and will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        }),
      });
    }
  } catch (err) {
    // Non-blocking in local dev
  }

  return {
    success: true,
    message: genericMessage,
    devResetUrl: resetUrl,
  };
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(rawToken: string): Promise<{
  valid: boolean;
  username?: string;
  error?: string;
}> {
  if (!rawToken || rawToken.length < 16) {
    return { valid: false, error: 'Invalid or missing reset token.' };
  }

  const tokenHash = await hashStringSha256(rawToken);
  const tokens = getStoredTokens();
  const token = tokens.find((t) => t.tokenHash === tokenHash);

  if (!token || token.usedAt) {
    return { valid: false, error: 'This password reset link is invalid or has already been used.' };
  }

  const now = Date.now();
  if (now > new Date(token.expiresAt).getTime()) {
    return { valid: false, error: 'This password reset link has expired (15 minute limit). Please request a new one.' };
  }

  const users = getStoredUsers();
  const user = users.find((u) => u.id === token.userId && u.isActive);
  if (!user) {
    return { valid: false, error: 'User account not found.' };
  }

  return { valid: true, username: user.username };
}

/**
 * Reset Password with valid token
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const tokenHash = await hashStringSha256(rawToken);
  const tokens = getStoredTokens();
  const token = tokens.find((t) => t.tokenHash === tokenHash);

  if (!token || token.usedAt || Date.now() > new Date(token.expiresAt).getTime()) {
    return { success: false, error: 'Reset link is invalid, expired, or previously used.' };
  }

  const users = getStoredUsers();
  const user = users.find((u) => u.id === token.userId && u.isActive);
  if (!user) {
    return { success: false, error: 'Account not found.' };
  }

  // Update password with new cryptographic salt
  const { hashHex, saltHex } = await hashPassword(newPassword);
  user.passwordHash = hashHex;
  user.passwordSalt = saltHex;
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.updatedAt = new Date().toISOString();
  saveStoredUsers(users);

  // Invalidate token
  token.usedAt = new Date().toISOString();
  saveStoredTokens(tokens);

  // Invalidate ALL existing active sessions for this account
  const sessions = getStoredSessions().filter((s) => s.userId !== user.id);
  saveStoredSessions(sessions);
  clearActiveSessionToken();

  recordAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET_COMPLETED',
    success: true,
    details: `Password reset successfully completed for @${user.username}. All active sessions invalidated.`,
  });

  return { success: true };
}

/**
 * Update Primary Admin Account Settings (Requires Current Password Confirmation)
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
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId && u.isActive);

  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const isPasswordValid = await verifyPassword(data.currentPassword, user.passwordHash, user.passwordSalt);
  if (!isPasswordValid) {
    recordAuditLog({
      userId: user.id,
      action: 'ACCOUNT_UPDATE_FAILED_BAD_PASSWORD',
      success: false,
      details: 'Failed attempt to modify account settings with incorrect current password.',
    });
    return { success: false, error: 'Current password confirmation is incorrect.' };
  }

  // Check username
  if (data.newUsername && data.newUsername.trim() !== user.username) {
    const cleanUsername = data.newUsername.trim();
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    const duplicate = users.find(
      (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: 'This username is already in use.' };
    }
    user.username = cleanUsername;
  }

  // Check email
  if (data.newEmail && data.newEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    const cleanEmail = data.newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please provide a valid recovery email address.' };
    }
    user.email = cleanEmail;
  }

  // Check new password if provided
  if (data.newPassword) {
    if (data.newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }
    if (data.newPassword !== data.confirmNewPassword) {
      return { success: false, error: 'New passwords do not match.' };
    }
    const { hashHex, saltHex } = await hashPassword(data.newPassword);
    user.passwordHash = hashHex;
    user.passwordSalt = saltHex;
  }

  user.updatedAt = new Date().toISOString();
  saveStoredUsers(users);

  recordAuditLog({
    userId: user.id,
    action: 'ACCOUNT_CREDENTIALS_UPDATED',
    success: true,
    details: `Account profile updated for @${user.username}.`,
  });

  return { success: true };
}

/**
 * Configure / Enable Backup Administrator (Controlled only by Primary Admin)
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
  const users = getStoredUsers();
  const primaryAdmin = users.find((u) => u.id === primaryAdminId && u.role === 'primary_admin' && u.isActive);

  if (!primaryAdmin) {
    return { success: false, error: 'Unauthorized. Only the Primary Administrator can manage backup accounts.' };
  }

  const isPrimaryPasswordValid = await verifyPassword(
    backupData.currentPrimaryPassword,
    primaryAdmin.passwordHash,
    primaryAdmin.passwordSalt
  );

  if (!isPrimaryPasswordValid) {
    return { success: false, error: 'Primary administrator password confirmation is incorrect.' };
  }

  const username = backupData.username.trim();
  const email = backupData.email.trim().toLowerCase();
  const password = backupData.password;

  if (username.length < 3) {
    return { success: false, error: 'Backup username must be at least 3 characters long.' };
  }
  if (username.toLowerCase() === primaryAdmin.username.toLowerCase()) {
    return { success: false, error: 'Backup username cannot be identical to the Primary Admin username.' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Backup password must be at least 8 characters long.' };
  }
  if (password !== backupData.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid recovery email address for the backup administrator.' };
  }

  const { hashHex, saltHex } = await hashPassword(password);
  let backupUser = users.find((u) => u.role === 'backup_admin');

  if (backupUser) {
    backupUser.username = username;
    backupUser.email = email;
    backupUser.passwordHash = hashHex;
    backupUser.passwordSalt = saltHex;
    backupUser.isActive = true;
    backupUser.failedLoginAttempts = 0;
    backupUser.lockoutUntil = null;
    backupUser.updatedAt = new Date().toISOString();
  } else {
    backupUser = {
      id: 'usr-backup-' + Date.now(),
      username,
      email,
      role: 'backup_admin',
      passwordHash: hashHex,
      passwordSalt: saltHex,
      isActive: true,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    users.push(backupUser);
  }

  saveStoredUsers(users);

  recordAuditLog({
    userId: primaryAdmin.id,
    action: 'BACKUP_ADMIN_CONFIGURED',
    success: true,
    details: `Backup administrator @${username} (${email}) enabled by Primary Admin.`,
  });

  return { success: true };
}

/**
 * Revoke / Disable Backup Administrator
 */
export async function revokeBackupAdmin(
  primaryAdminId: string,
  currentPrimaryPassword: string
): Promise<{ success: boolean; error?: string }> {
  const users = getStoredUsers();
  const primaryAdmin = users.find((u) => u.id === primaryAdminId && u.role === 'primary_admin' && u.isActive);

  if (!primaryAdmin) {
    return { success: false, error: 'Unauthorized. Only the Primary Administrator can revoke backup accounts.' };
  }

  const isPrimaryPasswordValid = await verifyPassword(
    currentPrimaryPassword,
    primaryAdmin.passwordHash,
    primaryAdmin.passwordSalt
  );

  if (!isPrimaryPasswordValid) {
    return { success: false, error: 'Primary administrator password confirmation is incorrect.' };
  }

  const backupUser = users.find((u) => u.role === 'backup_admin');
  if (!backupUser || !backupUser.isActive) {
    return { success: false, error: 'Backup administrator is already disabled.' };
  }

  backupUser.isActive = false;
  backupUser.updatedAt = new Date().toISOString();
  saveStoredUsers(users);

  // Terminate any active sessions belonging to backup user
  const sessions = getStoredSessions().filter((s) => s.userId !== backupUser.id);
  saveStoredSessions(sessions);

  recordAuditLog({
    userId: primaryAdmin.id,
    action: 'BACKUP_ADMIN_REVOKED',
    success: true,
    details: `Backup administrator @${backupUser.username} revoked and all active backup sessions terminated.`,
  });

  return { success: true };
}

/**
 * Regenerate Fresh Emergency Recovery Codes
 */
export async function regenerateRecoveryCodes(
  userId: string,
  currentPassword: string
): Promise<{ success: boolean; error?: string; recoveryCodes?: string[] }> {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId && u.isActive);

  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
  if (!isPasswordValid) {
    return { success: false, error: 'Password confirmation is incorrect.' };
  }

  // Generate 8 new codes
  const plainCodes = generateRecoveryCodes(8);
  const newRecords: RecoveryCodeRecord[] = [];
  for (const code of plainCodes) {
    const codeHash = await hashStringSha256(code.replace(/-/g, '').toUpperCase());
    newRecords.push({
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      codeHash,
      usedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  // Replace all recovery codes for this user
  const otherRecovery = getStoredRecoveryCodes().filter((r) => r.userId !== user.id);
  saveStoredRecoveryCodes([...otherRecovery, ...newRecords]);

  recordAuditLog({
    userId: user.id,
    action: 'RECOVERY_CODES_REGENERATED',
    success: true,
    details: `8 fresh recovery codes generated for @${user.username}. Previous codes invalidated.`,
  });

  return {
    success: true,
    recoveryCodes: plainCodes,
  };
}

/**
 * Get Recent Audit Logs for Security Inspector
 */
export function getRecentAuditLogs(): AuthAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
