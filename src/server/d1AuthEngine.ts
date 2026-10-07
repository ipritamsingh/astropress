/**
 * Cloudflare D1 Authentication & Recovery Engine
 * 
 * Shared engine executed by Cloudflare Pages Functions (functions/api/auth/[[route]].ts)
 * and local D1 development middleware.
 */

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SESSION_SECRET?: string;
}

// Security Constants
const PBKDF2_ITERATIONS = 100000;
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

export async function hashSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return arrayBufferToHex(hashBuffer);
}

export function generateRandomSecureHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return arrayBufferToHex(bytes.buffer);
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
  attempt: string,
  storedHashHex: string,
  storedSaltHex: string
): Promise<boolean> {
  try {
    const { hashHex } = await hashPassword(attempt, storedSaltHex);
    if (hashHex.length !== storedHashHex.length) return false;
    let match = true;
    for (let i = 0; i < hashHex.length; i++) {
      if (hashHex[i] !== storedHashHex[i]) {
        match = false;
      }
    }
    return match;
  } catch {
    return false;
  }
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      ...headers,
    },
  });
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = request.headers.get('X-Auth-Token');
  if (customHeader) {
    return customHeader.trim();
  }
  const cookieToken = parseCookie(request.headers.get('Cookie'), 'astropress_session');
  if (cookieToken) {
    return cookieToken.trim();
  }
  return null;
}

function createSessionCookie(token: string, rememberMe = false): string {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  return `astropress_session=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie(): string {
  return 'astropress_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

const D1_AUTH_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('primary_admin', 'backup_admin')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON recovery_codes(user_id, code_hash);
`;

let isSchemaEnsured = false;

async function ensureD1Schema(db: D1Database): Promise<void> {
  if (isSchemaEnsured) return;
  try {
    if (typeof db.exec === 'function') {
      await db.exec(D1_AUTH_SCHEMA_SQL);
      isSchemaEnsured = true;
    }
  } catch (err: any) {
    console.warn('[D1 Auth Engine] Automatic schema ensure note:', err?.message || err);
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/auth\/?/, '').split('/')[0] || '';

  if (!env.DB) {
    return jsonResponse(
      {
        error:
          'Cloudflare D1 database binding "DB" is missing. Please bind your D1 database "astropress-db" to variable name "DB" in Cloudflare Pages Settings -> Functions.',
        code: 'MISSING_D1_BINDING',
      },
      500
    );
  }

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  try {
    await ensureD1Schema(env.DB);

    // ------------------------------------------------------------------------
    // Route: GET /api/auth/status
    // ------------------------------------------------------------------------
    if (action === 'status' || action === '') {
      // 1. Check if Primary Admin exists in D1 database
      const primaryAdmin = await env.DB.prepare(
        'SELECT id, username, email, role, last_login_at FROM admin_users WHERE role = ? AND is_active = 1 LIMIT 1'
      )
        .bind('primary_admin')
        .first();

      if (!primaryAdmin) {
        return jsonResponse({
          isInitialized: false,
          isAuthenticated: false,
          currentUser: null,
          hasBackupAdmin: false,
          remainingRecoveryCodesCount: 0,
        });
      }

      // 2. Check if Backup Admin exists
      const backupAdmin = await env.DB.prepare(
        'SELECT username FROM admin_users WHERE role = ? AND is_active = 1 LIMIT 1'
      )
        .bind('backup_admin')
        .first();

      // 3. Check for active session
      const token = extractToken(request);
      if (!token) {
        return jsonResponse({
          isInitialized: true,
          isAuthenticated: false,
          currentUser: null,
          hasBackupAdmin: Boolean(backupAdmin),
          backupAdminUsername: backupAdmin?.username,
          remainingRecoveryCodesCount: 0,
        });
      }

      const tokenHash = await hashSha256(token);
      const session = await env.DB.prepare(
        `SELECT s.id as session_id, s.expires_at, s.last_active_at, u.id, u.username, u.email, u.role, u.last_login_at
         FROM admin_sessions s
         JOIN admin_users u ON s.user_id = u.id
         WHERE s.token_hash = ? AND u.is_active = 1 LIMIT 1`
      )
        .bind(tokenHash)
        .first();

      if (!session) {
        return jsonResponse(
          {
            isInitialized: true,
            isAuthenticated: false,
            currentUser: null,
            hasBackupAdmin: Boolean(backupAdmin),
            backupAdminUsername: backupAdmin?.username,
            remainingRecoveryCodesCount: 0,
          },
          200,
          { 'Set-Cookie': clearSessionCookie() }
        );
      }

      const now = Date.now();
      const expiresAt = new Date(session.expires_at).getTime();
      const lastActive = new Date(session.last_active_at).getTime();

      // Check session expiry
      if (now > expiresAt || now - lastActive > SESSION_IDLE_TIMEOUT_MS) {
        await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
          .bind(tokenHash)
          .run();

        return jsonResponse(
          {
            isInitialized: true,
            isAuthenticated: false,
            currentUser: null,
            hasBackupAdmin: Boolean(backupAdmin),
            backupAdminUsername: backupAdmin?.username,
            remainingRecoveryCodesCount: 0,
          },
          200,
          { 'Set-Cookie': clearSessionCookie() }
        );
      }

      // Update session last active time
      await env.DB.prepare('UPDATE admin_sessions SET last_active_at = ? WHERE token_hash = ?')
        .bind(new Date().toISOString(), tokenHash)
        .run();

      // Count remaining unused recovery codes
      const recoveryCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM recovery_codes WHERE user_id = ? AND used_at IS NULL'
      )
        .bind(session.id)
        .first();

      return jsonResponse({
        isInitialized: true,
        isAuthenticated: true,
        currentUser: {
          id: session.id,
          username: session.username,
          email: session.email,
          role: session.role,
          lastLoginAt: session.last_login_at,
        },
        hasBackupAdmin: Boolean(backupAdmin),
        backupAdminUsername: backupAdmin?.username,
        remainingRecoveryCodesCount: recoveryCount?.count || 0,
      });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/setup (One-time Initial Setup)
    // ------------------------------------------------------------------------
    if (action === 'setup' && request.method === 'POST') {
      const existing = await env.DB.prepare(
        'SELECT id FROM admin_users WHERE role = ? LIMIT 1'
      )
        .bind('primary_admin')
        .first();

      if (existing) {
        return jsonResponse(
          { success: false, error: 'Initial administrator setup has already been completed.' },
          400
        );
      }

      const body = (await request.json()) as any;
      const username = (body.username || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const confirmPassword = body.confirmPassword || '';

      if (username.length < 3) {
        return jsonResponse({ success: false, error: 'Username must be at least 3 characters long.' }, 400);
      }
      if (password.length < 8) {
        return jsonResponse({ success: false, error: 'Password must be at least 8 characters long.' }, 400);
      }
      if (password !== confirmPassword) {
        return jsonResponse({ success: false, error: 'Passwords do not match.' }, 400);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return jsonResponse({ success: false, error: 'Please enter a valid recovery email address.' }, 400);
      }

      const { hashHex, saltHex } = await hashPassword(password);
      const primaryId = 'usr-admin-' + Date.now();
      const nowIso = new Date().toISOString();

      const plainRecoveryCodes = generateRecoveryCodes(8);

      // Save Primary Admin to Cloudflare D1
      await env.DB.prepare(
        `INSERT INTO admin_users (id, username, email, role, password_hash, password_salt, is_active, failed_login_attempts, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, 'primary_admin', ?, ?, 1, 0, ?, ?, ?)`
      )
        .bind(primaryId, username, email, hashHex, saltHex, nowIso, nowIso, nowIso)
        .run();

      // Save recovery codes
      for (const code of plainRecoveryCodes) {
        const codeHash = await hashSha256(code.replace(/-/g, '').toUpperCase());
        await env.DB.prepare(
          `INSERT INTO recovery_codes (id, user_id, code_hash, used_at, created_at)
           VALUES (?, ?, ?, NULL, ?)`
        )
          .bind('rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6), primaryId, codeHash, nowIso)
          .run();
      }

      // Create session
      const rawToken = generateRandomSecureHex(32);
      const tokenHash = await hashSha256(rawToken);
      const expiresIso = new Date(Date.now() + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString();

      await env.DB.prepare(
        `INSERT INTO admin_sessions (id, user_id, token_hash, created_at, expires_at, last_active_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('sess-' + Date.now(), primaryId, tokenHash, nowIso, expiresIso, nowIso)
        .run();

      await env.DB.prepare(
        `INSERT INTO auth_audit_logs (id, user_id, action, ip_address, success, details, timestamp)
         VALUES (?, ?, 'INITIAL_ADMIN_SETUP_COMPLETED', ?, 1, ?, ?)`
      )
        .bind(
          'log-' + Date.now(),
          primaryId,
          request.headers.get('CF-Connecting-IP') || '127.0.0.1',
          `Primary Admin @${username} established in Cloudflare D1.`,
          nowIso
        )
        .run();

      return jsonResponse(
        {
          success: true,
          recoveryCodes: plainRecoveryCodes,
          sessionToken: rawToken,
        },
        200,
        { 'Set-Cookie': createSessionCookie(rawToken, true) }
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/login
    // ------------------------------------------------------------------------
    if (action === 'login' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const username = (body.username || '').trim();
      const password = body.password || '';
      const rememberMe = Boolean(body.rememberMe);

      const user = await env.DB.prepare(
        'SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) AND is_active = 1 LIMIT 1'
      )
        .bind(username)
        .first();

      if (!user) {
        await hashPassword(password, '00000000000000000000000000000000');
        return jsonResponse({ success: false, error: 'Invalid username or password.' }, 401);
      }

      const now = Date.now();
      if (user.lockout_until) {
        const lockoutEnd = new Date(user.lockout_until).getTime();
        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil((lockoutEnd - now) / 60000);
          return jsonResponse(
            {
              success: false,
              error: `Account is temporarily locked due to repeated failed attempts. Please try again in ${remainingMinutes} minutes.`,
            },
            429
          );
        } else {
          await env.DB.prepare('UPDATE admin_users SET lockout_until = NULL, failed_login_attempts = 0 WHERE id = ?')
            .bind(user.id)
            .run();
        }
      }

      const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
      if (!isValid) {
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        let lockoutUntil: string | null = null;
        let errorMsg = 'Invalid username or password.';

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          lockoutUntil = new Date(now + LOCKOUT_DURATION_MS).toISOString();
          errorMsg = 'Too many failed login attempts. Account temporarily locked for 15 minutes.';
        }

        await env.DB.prepare(
          'UPDATE admin_users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?'
        )
          .bind(failedAttempts, lockoutUntil, user.id)
          .run();

        return jsonResponse({ success: false, error: errorMsg }, 401);
      }

      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        'UPDATE admin_users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ? WHERE id = ?'
      )
        .bind(nowIso, user.id)
        .run();

      const rawToken = generateRandomSecureHex(32);
      const tokenHash = await hashSha256(rawToken);
      const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : SESSION_ABSOLUTE_TIMEOUT_MS;
      const expiresIso = new Date(now + durationMs).toISOString();

      await env.DB.prepare(
        `INSERT INTO admin_sessions (id, user_id, token_hash, created_at, expires_at, last_active_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('sess-' + Date.now(), user.id, tokenHash, nowIso, expiresIso, nowIso)
        .run();

      await env.DB.prepare(
        `INSERT INTO auth_audit_logs (id, user_id, action, ip_address, success, details, timestamp)
         VALUES (?, ?, 'LOGIN_SUCCESSFUL', ?, 1, ?, ?)`
      )
        .bind(
          'log-' + Date.now(),
          user.id,
          request.headers.get('CF-Connecting-IP') || '127.0.0.1',
          `Administrator @${user.username} authenticated successfully.`,
          nowIso
        )
        .run();

      return jsonResponse(
        { success: true, sessionToken: rawToken },
        200,
        { 'Set-Cookie': createSessionCookie(rawToken, rememberMe) }
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/recovery-login
    // ------------------------------------------------------------------------
    if (action === 'recovery-login' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const username = (body.username || '').trim();
      const code = (body.code || '').trim().replace(/-/g, '').toUpperCase();

      const user = await env.DB.prepare(
        'SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) AND is_active = 1 LIMIT 1'
      )
        .bind(username)
        .first();

      if (!user) {
        return jsonResponse({ success: false, error: 'Invalid username or recovery code.' }, 401);
      }

      const codeHash = await hashSha256(code);
      const match = await env.DB.prepare(
        'SELECT id FROM recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL LIMIT 1'
      )
        .bind(user.id, codeHash)
        .first();

      if (!match) {
        return jsonResponse({ success: false, error: 'Invalid or already used recovery code.' }, 401);
      }

      const nowIso = new Date().toISOString();
      await env.DB.prepare('UPDATE recovery_codes SET used_at = ? WHERE id = ?')
        .bind(nowIso, match.id)
        .run();

      await env.DB.prepare(
        'UPDATE admin_users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ? WHERE id = ?'
      )
        .bind(nowIso, user.id)
        .run();

      const rawToken = generateRandomSecureHex(32);
      const tokenHash = await hashSha256(rawToken);
      const expiresIso = new Date(Date.now() + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString();

      await env.DB.prepare(
        `INSERT INTO admin_sessions (id, user_id, token_hash, created_at, expires_at, last_active_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind('sess-rec-' + Date.now(), user.id, tokenHash, nowIso, expiresIso, nowIso)
        .run();

      return jsonResponse(
        { success: true, sessionToken: rawToken },
        200,
        { 'Set-Cookie': createSessionCookie(rawToken, false) }
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/logout
    // ------------------------------------------------------------------------
    if (action === 'logout' && request.method === 'POST') {
      const token = extractToken(request);
      if (token) {
        const tokenHash = await hashSha256(token);
        await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
          .bind(tokenHash)
          .run();
      }
      return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/forgot-password
    // ------------------------------------------------------------------------
    if (action === 'forgot-password' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const email = (body.email || '').trim().toLowerCase();
      const genericMsg =
        'If this recovery email is registered with an administrator account, password reset instructions have been sent. Please check your inbox (link expires in 15 minutes).';

      const user = await env.DB.prepare(
        'SELECT id, username, email FROM admin_users WHERE LOWER(email) = LOWER(?) AND is_active = 1 LIMIT 1'
      )
        .bind(email)
        .first();

      if (!user) {
        return jsonResponse({ success: true, message: genericMsg });
      }

      const rawToken = generateRandomSecureHex(32);
      const tokenHash = await hashSha256(rawToken);
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

      await env.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL')
        .bind(nowIso, user.id)
        .run();

      await env.DB.prepare(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`
      )
        .bind('tok-' + Date.now(), user.id, tokenHash, expiresIso, nowIso)
        .run();

      const resetUrl = `${url.origin}/admin/?action=reset-password&token=${rawToken}`;

      if (env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'AstroPress Security <security@astropress.dev>',
              to: email,
              subject: 'AstroPress Password Reset Request',
              html: `
                <h2>AstroPress Password Reset</h2>
                <p>A password reset was requested for administrator account <strong>@${user.username}</strong>.</p>
                <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></p>
                <p>This single-use link expires in 15 minutes.</p>
              `,
            }),
          });
        } catch {}
      }

      return jsonResponse({
        success: true,
        message: genericMsg,
        devResetUrl: resetUrl,
      });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/verify-reset-token
    // ------------------------------------------------------------------------
    if (action === 'verify-reset-token' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const rawToken = (body.token || '').trim();

      if (rawToken.length < 16) {
        return jsonResponse({ valid: false, error: 'Invalid or missing reset token.' });
      }

      const tokenHash = await hashSha256(rawToken);
      const tokenRecord = await env.DB.prepare(
        `SELECT t.expires_at, t.used_at, u.username
         FROM password_reset_tokens t
         JOIN admin_users u ON t.user_id = u.id
         WHERE t.token_hash = ? LIMIT 1`
      )
        .bind(tokenHash)
        .first();

      if (!tokenRecord || tokenRecord.used_at) {
        return jsonResponse({ valid: false, error: 'This password reset link is invalid or has already been used.' });
      }

      if (Date.now() > new Date(tokenRecord.expires_at).getTime()) {
        return jsonResponse({ valid: false, error: 'This password reset link has expired (15 minute limit).' });
      }

      return jsonResponse({ valid: true, username: tokenRecord.username });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/reset-password
    // ------------------------------------------------------------------------
    if (action === 'reset-password' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const rawToken = (body.token || '').trim();
      const newPassword = body.newPassword || '';
      const confirmPassword = body.confirmPassword || '';

      if (newPassword.length < 8) {
        return jsonResponse({ success: false, error: 'Password must be at least 8 characters long.' }, 400);
      }
      if (newPassword !== confirmPassword) {
        return jsonResponse({ success: false, error: 'Passwords do not match.' }, 400);
      }

      const tokenHash = await hashSha256(rawToken);
      const tokenRecord = await env.DB.prepare(
        'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? LIMIT 1'
      )
        .bind(tokenHash)
        .first();

      if (!tokenRecord || tokenRecord.used_at || Date.now() > new Date(tokenRecord.expires_at).getTime()) {
        return jsonResponse({ success: false, error: 'Reset link is invalid, expired, or previously used.' }, 400);
      }

      const { hashHex, saltHex } = await hashPassword(newPassword);
      const nowIso = new Date().toISOString();

      await env.DB.prepare(
        'UPDATE admin_users SET password_hash = ?, password_salt = ?, failed_login_attempts = 0, lockout_until = NULL, updated_at = ? WHERE id = ?'
      )
        .bind(hashHex, saltHex, nowIso, tokenRecord.user_id)
        .run();

      await env.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?')
        .bind(nowIso, tokenRecord.id)
        .run();

      await env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?')
        .bind(tokenRecord.user_id)
        .run();

      return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
    }

    // ------------------------------------------------------------------------
    // Authenticated Routes
    // ------------------------------------------------------------------------
    const token = extractToken(request);
    if (!token) {
      return jsonResponse({ error: 'Unauthorized. Authentication session required.' }, 401);
    }

    const tokenHash = await hashSha256(token);
    const sessionUser = await env.DB.prepare(
      `SELECT s.id as session_id, u.*
       FROM admin_sessions s
       JOIN admin_users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND u.is_active = 1 LIMIT 1`
    )
      .bind(tokenHash)
      .first();

    if (!sessionUser) {
      return jsonResponse({ error: 'Unauthorized or expired session.' }, 401, {
        'Set-Cookie': clearSessionCookie(),
      });
    }

    await env.DB.prepare('UPDATE admin_sessions SET last_active_at = ? WHERE token_hash = ?')
      .bind(new Date().toISOString(), tokenHash)
      .run();

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/update-account
    // ------------------------------------------------------------------------
    if (action === 'update-account' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const currentPassword = body.currentPassword || '';

      const isCurrentValid = await verifyPassword(
        currentPassword,
        sessionUser.password_hash,
        sessionUser.password_salt
      );

      if (!isCurrentValid) {
        return jsonResponse({ success: false, error: 'Current password confirmation is incorrect.' }, 400);
      }

      let newUsername = sessionUser.username;
      let newEmail = sessionUser.email;
      let newHash = sessionUser.password_hash;
      let newSalt = sessionUser.password_salt;

      if (body.newUsername && body.newUsername.trim() !== sessionUser.username) {
        const cleanUser = body.newUsername.trim();
        if (cleanUser.length < 3) {
          return jsonResponse({ success: false, error: 'Username must be at least 3 characters long.' }, 400);
        }
        newUsername = cleanUser;
      }

      if (body.newEmail && body.newEmail.trim().toLowerCase() !== sessionUser.email.toLowerCase()) {
        newEmail = body.newEmail.trim().toLowerCase();
      }

      if (body.newPassword) {
        if (body.newPassword.length < 8) {
          return jsonResponse({ success: false, error: 'New password must be at least 8 characters long.' }, 400);
        }
        if (body.newPassword !== body.confirmNewPassword) {
          return jsonResponse({ success: false, error: 'New passwords do not match.' }, 400);
        }
        const pwdRes = await hashPassword(body.newPassword);
        newHash = pwdRes.hashHex;
        newSalt = pwdRes.saltHex;
      }

      await env.DB.prepare(
        'UPDATE admin_users SET username = ?, email = ?, password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?'
      )
        .bind(newUsername, newEmail, newHash, newSalt, new Date().toISOString(), sessionUser.id)
        .run();

      return jsonResponse({ success: true });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/backup-admin
    // ------------------------------------------------------------------------
    if (action === 'backup-admin' && request.method === 'POST') {
      if (sessionUser.role !== 'primary_admin') {
        return jsonResponse({ success: false, error: 'Unauthorized.' }, 403);
      }

      const body = (await request.json()) as any;
      const currentPrimaryPassword = body.currentPrimaryPassword || '';
      const isPrimaryValid = await verifyPassword(
        currentPrimaryPassword,
        sessionUser.password_hash,
        sessionUser.password_salt
      );

      if (!isPrimaryValid) {
        return jsonResponse({ success: false, error: 'Primary administrator password confirmation is incorrect.' }, 400);
      }

      const username = (body.username || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      if (username.length < 3) {
        return jsonResponse({ success: false, error: 'Backup username must be at least 3 characters long.' }, 400);
      }
      if (username.toLowerCase() === sessionUser.username.toLowerCase()) {
        return jsonResponse({ success: false, error: 'Backup username cannot be identical to Primary Admin.' }, 400);
      }
      if (password.length < 8) {
        return jsonResponse({ success: false, error: 'Backup password must be at least 8 characters long.' }, 400);
      }
      if (password !== body.confirmPassword) {
        return jsonResponse({ success: false, error: 'Passwords do not match.' }, 400);
      }

      const { hashHex, saltHex } = await hashPassword(password);
      const nowIso = new Date().toISOString();

      const existingBackup = await env.DB.prepare('SELECT id FROM admin_users WHERE role = ? LIMIT 1')
        .bind('backup_admin')
        .first();

      if (existingBackup) {
        await env.DB.prepare(
          'UPDATE admin_users SET username = ?, email = ?, password_hash = ?, password_salt = ?, is_active = 1, failed_login_attempts = 0, lockout_until = NULL, updated_at = ? WHERE id = ?'
        )
          .bind(username, email, hashHex, saltHex, nowIso, existingBackup.id)
          .run();
      } else {
        await env.DB.prepare(
          `INSERT INTO admin_users (id, username, email, role, password_hash, password_salt, is_active, failed_login_attempts, created_at, updated_at)
           VALUES (?, ?, ?, 'backup_admin', ?, ?, 1, 0, ?, ?)`
        )
          .bind('usr-backup-' + Date.now(), username, email, hashHex, saltHex, nowIso, nowIso)
          .run();
      }

      return jsonResponse({ success: true });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/revoke-backup
    // ------------------------------------------------------------------------
    if (action === 'revoke-backup' && request.method === 'POST') {
      if (sessionUser.role !== 'primary_admin') {
        return jsonResponse({ success: false, error: 'Unauthorized.' }, 403);
      }

      const body = (await request.json()) as any;
      const isPrimaryValid = await verifyPassword(
        body.currentPrimaryPassword || '',
        sessionUser.password_hash,
        sessionUser.password_salt
      );

      if (!isPrimaryValid) {
        return jsonResponse({ success: false, error: 'Password confirmation is incorrect.' }, 400);
      }

      const backupUser = await env.DB.prepare('SELECT id FROM admin_users WHERE role = ? LIMIT 1')
        .bind('backup_admin')
        .first();

      if (backupUser) {
        await env.DB.prepare('UPDATE admin_users SET is_active = 0, updated_at = ? WHERE id = ?')
          .bind(new Date().toISOString(), backupUser.id)
          .run();
        await env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?')
          .bind(backupUser.id)
          .run();
      }

      return jsonResponse({ success: true });
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/auth/regenerate-recovery-codes
    // ------------------------------------------------------------------------
    if (action === 'regenerate-recovery-codes' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const isPasswordValid = await verifyPassword(
        body.currentPassword || '',
        sessionUser.password_hash,
        sessionUser.password_salt
      );

      if (!isPasswordValid) {
        return jsonResponse({ success: false, error: 'Password confirmation is incorrect.' }, 400);
      }

      const plainCodes = generateRecoveryCodes(8);
      const nowIso = new Date().toISOString();

      await env.DB.prepare('DELETE FROM recovery_codes WHERE user_id = ?')
        .bind(sessionUser.id)
        .run();

      for (const code of plainCodes) {
        const codeHash = await hashSha256(code.replace(/-/g, '').toUpperCase());
        await env.DB.prepare(
          `INSERT INTO recovery_codes (id, user_id, code_hash, used_at, created_at)
           VALUES (?, ?, ?, NULL, ?)`
        )
          .bind('rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6), sessionUser.id, codeHash, nowIso)
          .run();
      }

      return jsonResponse({ success: true, recoveryCodes: plainCodes });
    }

    // ------------------------------------------------------------------------
    // Route: GET /api/auth/audit-logs
    // ------------------------------------------------------------------------
    if (action === 'audit-logs') {
      const logs = await env.DB.prepare(
        'SELECT * FROM auth_audit_logs ORDER BY timestamp DESC LIMIT 50'
      ).all();
      return jsonResponse(logs.results || []);
    }

    return jsonResponse({ error: 'Endpoint not found.' }, 404);
  } catch (err: any) {
    if (err?.message && String(err.message).toLowerCase().includes('no such table')) {
      try {
        await ensureD1Schema(env.DB);
        if (action === 'status' || action === '') {
          return jsonResponse({
            isInitialized: false,
            isAuthenticated: false,
            currentUser: null,
            hasBackupAdmin: false,
            remainingRecoveryCodesCount: 0,
          });
        }
      } catch {}
    }
    return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
  }
};
