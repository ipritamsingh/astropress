import React, { useState } from 'react';
import { Post, Page, Category, Tag, ThemeSettings } from '../../types/cms';
import {
  Wrench,
  Download,
  Copy,
  Check,
  FileCode,
  Globe,
  Terminal,
  Server,
  Cloud,
  ExternalLink,
  ChevronRight,
  GitBranch,
} from 'lucide-react';

interface Props {
  posts: Post[];
  pages: Page[];
  categories: Category[];
  tags: Tag[];
  themeSettings: ThemeSettings;
}

export const ToolsExporter: React.FC<Props> = ({
  posts,
  pages,
  categories,
  tags,
  themeSettings,
}) => {
  const [activeFile, setActiveFile] = useState<string>('astro.config.mjs');
  const [copied, setCopied] = useState(false);

  const fileTemplates: Record<string, { desc: string; content: string }> = {
    'astro.config.mjs': {
      desc: 'Astro Configuration with Tailwind and Cloudflare Adapter',
      content: `// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://astropress.pages.dev',
  output: 'static', // Static Generation by default for Cloudflare Pages edge delivery
  integrations: [tailwind()],
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
});`,
    },
    'src/content/config.ts': {
      desc: 'Astro Content Collections Schema with Zod Validation',
      content: `// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default('Amit Singh'),
    category: z.string().default('Technology'),
    tags: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    excerpt: z.string(),
    readingTime: z.number().default(5),
    template: z.enum(['standard', 'cover-hero', 'minimal-editorial', 'sidebar-right']).default('standard'),
    draft: z.boolean().default(false),
    blocks: z.array(z.any()).optional(),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      focusKeyword: z.string().optional(),
      canonicalUrl: z.string().optional(),
      robotsIndex: z.boolean().default(true),
      robotsFollow: z.boolean().default(true),
      ogImage: z.string().optional(),
    }).optional(),
  }),
});

const pagesCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    template: z.enum(['default', 'full-width', 'contact', 'about', 'landing']).default('default'),
    draft: z.boolean().default(false),
    blocks: z.array(z.any()).optional(),
  }),
});

export const collections = {
  posts: postsCollection,
  pages: pagesCollection,
};`,
    },
    'wrangler.toml': {
      desc: 'Cloudflare Workers Authenticator Configuration (Sveltia GitHub OAuth)',
      content: `# wrangler.toml (Cloudflare Worker for Sveltia CMS GitHub OAuth)
name = "sveltia-cms-authenticator"
main = "src/index.ts"
compatibility_date = "2026-09-01"

[vars]
# In Cloudflare Dashboard > Workers > Settings > Variables:
# GITHUB_CLIENT_ID = "Iv1.your_github_client_id"
# GITHUB_CLIENT_SECRET = "secret_encrypted_in_cloudflare"
REDIRECT_URI = "https://sveltia-cms-authenticator.workers.dev/callback"`,
    },
    'public/admin/config.yml': {
      desc: 'Sveltia CMS Configuration for GitHub Backend',
      content: `# public/admin/config.yml
backend:
  name: github
  repo: your-username/astropress-cms
  branch: main
  auth_endpoint: https://sveltia-cms-authenticator.workers.dev/auth
  local_backend: true

media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  - name: "posts"
    label: "Posts"
    folder: "src/content/posts"
    create: true
    format: "frontmatter"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Slug", name: "slug", widget: "string" }
      - { label: "Publication Date", name: "pubDate", widget: "datetime" }
      - { label: "Author", name: "author", widget: "relation", collection: "authors", value_field: "name" }
      - { label: "Category", name: "category", widget: "relation", collection: "categories", value_field: "name" }
      - { label: "Body Content", name: "body", widget: "markdown" }`,
    },
    'package.json': {
      desc: 'Astro Production Package Manifest',
      content: `{
  "name": "astropress-production",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.0",
    "@astrojs/cloudflare": "^12.0.0",
    "@astrojs/tailwind": "^6.0.0",
    "astro": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0"
  }
}`,
    },
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJsonBundle = () => {
    const bundle = {
      themeSettings,
      categories,
      tags,
      posts,
      pages,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astropress-content-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tools & Astro Codebase Exporter</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production-ready Astro configs, Sveltia CMS files, and Cloudflare Pages setup
          </p>
        </div>

        <button
          onClick={downloadJsonBundle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-blue-400" />
          <span>Export All CMS Data (JSON)</span>
        </button>
      </div>

      {/* Cloudflare Pages Deployment Step-by-Step Guide */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
          <Cloud className="h-4 w-4" />
          <span>Cloudflare Pages & Workers Deployment Guide</span>
        </div>
        <h3 className="text-base font-bold text-white">How to Deploy AstroPress to Cloudflare Pages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <span className="font-bold text-white block">Step 1: Push to GitHub</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Create a repository on GitHub (e.g. <code className="text-emerald-300">your-user/astropress</code>) and push the Astro project files.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <span className="font-bold text-white block">Step 2: Connect Cloudflare Pages</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In Cloudflare Dashboard: Pages &gt; Connect GitHub &gt; Select repo.<br />
              <b className="text-slate-200">Build command:</b> <code className="text-emerald-300">npm run build</code><br />
              <b className="text-slate-200">Output directory:</b> <code className="text-emerald-300">dist</code>
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <span className="font-bold text-white block">Step 3: GitHub OAuth for Sveltia</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Deploy the Sveltia Authenticator worker with your GitHub OAuth App Client ID & Secret to allow browser commits.
            </p>
          </div>
        </div>
      </div>

      {/* Astro Code Template Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Astro Project Files
          </h3>
          {Object.keys(fileTemplates).map((fname) => (
            <button
              key={fname}
              onClick={() => setActiveFile(fname)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left font-mono text-xs transition-colors ${
                activeFile === fname
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-slate-400" />
                <span>{fname}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            </button>
          ))}
        </div>

        {/* Code Content Display */}
        <div className="lg:col-span-2 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="font-mono text-xs font-bold text-white block">{activeFile}</span>
                <span className="text-[11px] text-slate-400">{fileTemplates[activeFile].desc}</span>
              </div>
              <button
                onClick={() => handleCopy(fileTemplates[activeFile].content)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>
            <pre className="font-mono-custom text-emerald-400 text-xs overflow-x-auto p-2 leading-relaxed max-h-[460px]">
              {fileTemplates[activeFile].content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
