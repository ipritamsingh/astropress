import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest } from './d1AuthEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const d1Dir = path.join(rootDir, '.d1');
const dbPath = path.join(d1Dir, 'astropress-db.sqlite');

let localDb: any = null;

export function getLocalD1Database() {
  if (localDb) return localDb;

  if (!fs.existsSync(d1Dir)) {
    fs.mkdirSync(d1Dir, { recursive: true });
  }

  const rawDb = new DatabaseSync(dbPath);

  // Initialize schema from migrations/0001_auth_schema.sql if needed
  const schemaFile = path.join(rootDir, 'migrations', '0001_auth_schema.sql');
  if (fs.existsSync(schemaFile)) {
    const schemaSql = fs.readFileSync(schemaFile, 'utf8');
    rawDb.exec(schemaSql);
  }

  // Wrap rawDb with Cloudflare D1 API interface
  localDb = {
    prepare(sql: string) {
      let boundValues: any[] = [];
      return {
        bind(...values: any[]) {
          boundValues = values.map((v) => (v === undefined ? null : v));
          return this;
        },
        async first<T = any>(colName?: string): Promise<T | null> {
          const stmt = rawDb.prepare(sql);
          const row = stmt.get(...boundValues) as any;
          if (!row) return null;
          if (colName) return row[colName] ?? null;
          return row as T;
        },
        async all<T = any>(): Promise<{ results: T[]; success: boolean }> {
          const stmt = rawDb.prepare(sql);
          const results = stmt.all(...boundValues) as T[];
          return { results, success: true };
        },
        async run<T = any>(): Promise<{ success: boolean; meta: any }> {
          const stmt = rawDb.prepare(sql);
          const meta = stmt.run(...boundValues);
          return { success: true, meta };
        },
      };
    },
    async exec(sql: string) {
      rawDb.exec(sql);
      return { count: 0, duration: 0 };
    },
    async batch(stmts: any[]) {
      const results = [];
      for (const s of stmts) {
        results.push(await s.run());
      }
      return results;
    },
  };

  return localDb;
}

export async function handleLocalAuthRequest(req: any, res: any) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'] || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${req.url}`;

    // Read body if method has body
    let bodyBuffer: Buffer | null = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value as string);
        }
      }
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body: bodyBuffer && bodyBuffer.length > 0 ? (new Uint8Array(bodyBuffer) as any) : undefined,
    });

    const env = {
      DB: getLocalD1Database(),
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET,
    };

    const response = await onRequest({
      request: webRequest,
      env,
      functionPath: '/api/auth',
      waitUntil: () => {},
      next: async () => new Response(null, { status: 404 }),
      params: {} as any,
      data: {} as any,
    });

    res.statusCode = response.status;
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const respText = await response.text();
    res.end(respText);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Local D1 Server Error' }));
  }
}
