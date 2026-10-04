# Cloudflare D1 Authentication & Persistence Guide for AstroPress

This document provides exact instructions to link your existing Cloudflare D1 database (`astropress-db`) with your AstroPress Cloudflare Pages deployment.

---

## 1. Cloudflare D1 Configuration

- **Database Name**: `astropress-db`
- **Pages D1 Binding Name**: `DB`
- **GitHub Repository**: `https://github.com/ipritamsingh/astropress`
- **Branch**: `main`

---

## 2. Execute SQL Migrations on Cloudflare D1

Run the safe, versioned schema migration from your local terminal with Wrangler:

```bash
# Execute migration against your remote Cloudflare D1 database (astropress-db)
npx wrangler d1 execute astropress-db --remote --file=./migrations/0001_auth_schema.sql
```

> **Safety Guarantee**: The migration in `migrations/0001_auth_schema.sql` uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. It never deletes, drops, resets, or overwrites existing tables or data.

---

## 3. Configure Cloudflare Pages D1 Binding

You can bind the database through the **Cloudflare Dashboard** or `wrangler.toml`:

### Option A: Cloudflare Dashboard (Recommended for Pages)
1. Go to **Cloudflare Dashboard** &rarr; **Workers & Pages**.
2. Select your AstroPress Pages project (`astropress`).
3. Click **Settings** &rarr; **Functions**.
4. Scroll down to **D1 Database Bindings** and click **Add binding**.
5. Set:
   - **Variable name**: `DB`
   - **D1 Database**: `astropress-db`
6. Click **Save**.

### Option B: Via `wrangler.toml`
The repository includes `wrangler.toml` configured with:
```toml
name = "astropress"
compatibility_date = "2026-10-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "astropress-db"
database_id = "<YOUR_D1_DATABASE_ID>"
```
To find your `<YOUR_D1_DATABASE_ID>`, run:
```bash
npx wrangler d1 info astropress-db
```

---

## 4. How the Persistent D1 Architecture Works

1. **Initial Admin Setup Gate**:
   - The server function (`functions/api/auth/[[route]].ts`) executes:
     ```sql
     SELECT id, username, email FROM admin_users WHERE role = 'primary_admin' AND is_active = 1 LIMIT 1
     ```
   - If no row exists in D1, the client displays **Initial Admin Setup**.
   - As soon as the primary admin account is created, the credentials and recovery code hashes are committed to Cloudflare D1.

2. **Permanent Setup Lock**:
   - After initial setup, future queries to `/api/auth/status` return `isInitialized: true`.
   - Any further attempt to POST to `/api/auth/setup` is rejected with HTTP 400.
   - All subsequent visitors and future builds will always be presented with the **Admin Login** screen.

3. **Server-Side Security**:
   - Passwords are encrypted with PBKDF2-SHA256 (100,000 iterations) with a unique 16-byte random cryptographic salt. Plaintext passwords are never stored.
   - Sessions are managed server-side via `admin_sessions` in D1 with idle (2 hr) and absolute (24 hr) timeouts.
   - Single-use recovery codes are stored solely as SHA-256 hashes in `recovery_codes` in D1 and invalidated immediately upon first use.
   - Direct navigation to `/admin` or `/dashboard` cannot bypass server-side validation.

---

## 5. How to Test That the Admin Account Persists After Redeployment

Follow these steps to verify persistent storage:

1. **Perform Initial Setup**:
   - Click **"Launch Admin Studio"** on your deployed site.
   - Complete the one-time Initial Admin Setup form (Username, Email, Password).
   - Save your 8 emergency recovery codes.
2. **Verify Database Records**:
   - In Cloudflare Dashboard &rarr; **Workers & Pages** &rarr; **D1** &rarr; `astropress-db` &rarr; **Console**, run:
     ```sql
     SELECT id, username, email, role, created_at FROM admin_users;
     ```
   - Confirm that your administrator account appears in the output.
3. **Trigger a New Build & Deployment**:
   - Push a commit to `main` on `https://github.com/ipritamsingh/astropress`.
   - Wait for Cloudflare Pages to finish building and deploying.
4. **Test After Redeployment**:
   - Open a clean browser window / incognito tab and navigate to `https://<YOUR-PAGES-DOMAIN>/dashboard`.
   - Confirm that the **Admin Login** page appears (NOT the Initial Setup page).
   - Log in with your Primary Admin username and password.
   - Confirm that authentication succeeds and opens your Admin Dashboard.
