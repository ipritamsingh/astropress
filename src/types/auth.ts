export type AdminRole = 'primary_admin' | 'backup_admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminSession {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface RecoveryCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: string | null;
  createdAt: string;
}

export interface AuthAuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  success: boolean;
  details?: string;
  timestamp: string;
}

export interface AuthPublicState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: AdminRole;
    lastLoginAt: string | null;
  } | null;
  hasBackupAdmin: boolean;
  backupAdminUsername?: string;
  remainingRecoveryCodesCount: number;
}
