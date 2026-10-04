# AstroPress Cloudflare D1 Authentication & Security Guide

This document explains the production security architecture and setup steps for Cloudflare Pages, Cloudflare D1 database bindings, email provider integration, and emergency recovery procedures.

---

## 1. Authentication Architecture

- **Password Hashing**: PBKDF2 with SHA-256 (100,000 iterations) and cryptographically secure random 16-byte salt per user.
- **Session Tokens**: 32-byte cryptographically secure random hex tokens hashed with SHA-256 before storage.
- **Session Expiry**: 2-hour idle timeout and 24-hour absolute timeout (30 days with Remember Me).
- **Rate Limiting & Lockout**: 5 failed password attempts trigger a 15-minute temporary lockout.
- **Account Recovery**:
  - Single-use 15-minute password reset links.
  - 8 single-use emergency recovery codes stored as SHA-256 hashes.
- **Backup Administrator**:
  - Disabled by default for single-user personal simplicity.
  - Can be enabled with restricted scope by Primary Administrator.

---

## 2. Cloudflare D1 Database Provisioning

To bind a Cloudflare D1 database to your AstroPress Cloudflare Pages project:

1. **Create D1 Database**:
   ```bash
   npx wrangler d1 create astropress-auth
   ```
2. **Apply Migration**:
   ```bash
   npx wrangler d1 execute astropress-auth --file=./migrations/0001_auth_schema.sql
   ```
3. **Bind in `wrangler.toml` (or Cloudflare Dashboard &rarr; Pages &rarr; Settings &rarr; Functions &rarr; D1 Database Bindings)**:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "astropress-auth"
   database_id = "<YOUR_D1_DATABASE_ID>"
   ```

---

## 3. Email Provider Configuration (Resend)

For automated password-reset emails:

1. Sign up for a free tier account at [resend.com](https://resend.com).
2. Generate an API Key with sending permissions.
3. In Cloudflare Pages Dashboard &rarr; **Settings** &rarr; **Environment Variables**:
   - `RESEND_API_KEY`: `re_xxxxxxxxx`
   - `SENDER_EMAIL`: `security@yourdomain.com`

---

## 4. Emergency Lockout Recovery Procedure

If the Primary Administrator loses access to both their password and registered recovery email:

1. **Option A: Use an Emergency Recovery Code**:
   - On the Admin Login page, click **"Use emergency recovery code"**.
   - Enter your username and one of your 8 saved one-time codes (`XXXX-XXXX-XXXX`).

2. **Option B: Cloudflare D1 Direct Reset**:
   - Access your Cloudflare Dashboard &rarr; **Workers & Pages** &rarr; **D1** &rarr; `astropress-auth` &rarr; **Console**.
   - To authorize a fresh initial setup run:
     ```sql
     DELETE FROM admin_sessions;
     DELETE FROM admin_users;
     DELETE FROM recovery_codes;
     ```
   - Refresh the `/admin` URL to initialize a new Primary Administrator.
