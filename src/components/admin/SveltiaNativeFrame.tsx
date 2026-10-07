import React, { useState } from 'react';
import { ExternalLink, Code2, ShieldCheck, RefreshCw, FileText, Check } from 'lucide-react';

export const SveltiaNativeFrame: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'embed' | 'config'>('embed');
  const [iframeKey, setIframeKey] = useState(0);

  const rawConfigYml = `# Sveltia CMS Configuration for AstroPress
backend:
  name: github
  repo: your-username/astropress-cms
  branch: main
  auth_endpoint: https://sveltia-authenticator.your-subdomain.workers.dev/auth
  local_backend: true

media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  - name: "posts"
    label: "Posts"
    folder: "src/content/posts"
    create: true
    format: "frontmatter"
    extension: "md"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Slug", name: "slug", widget: "string" }
      - { label: "Publication Date", name: "pubDate", widget: "datetime" }
      - { label: "Draft Status", name: "draft", widget: "boolean" }
      - { label: "Author", name: "author", widget: "relation", collection: "authors" }
      - { label: "Category", name: "category", widget: "relation", collection: "categories" }
      - { label: "Body Content", name: "body", widget: "markdown" }
      - label: "Gutenberg Blocks"
        name: "blocks"
        widget: "list"
        fields:
          - { label: "Type", name: "type", widget: "string" }
          - { label: "Content", name: "content", widget: "text" }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sveltia CMS Native Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            The lightweight, client-side, Git-backed CMS engine powering AstroPress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs font-semibold">
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'embed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Native Sveltia Interface
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'config' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              View config.yml
            </button>
          </div>

          <a
            href="/admin/index.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            <span>Open in Tab</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {activeTab === 'embed' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-900 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Live Sveltia CMS Integration</span>
              <p className="text-blue-800 leading-relaxed">
                Below is the native Sveltia CMS interface loaded from <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">/public/admin/index.html</code>.
                When configured with your GitHub repository and Cloudflare Authenticator, Sveltia provides native Git authentication, pull request workflows, and media uploads.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-md h-[650px] relative">
            <iframe
              key={iframeKey}
              src="/admin/index.html"
              title="Native Sveltia CMS"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="font-mono text-xs font-bold text-white">public/admin/config.yml</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(rawConfigYml);
                alert('Copied config.yml to clipboard!');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Copy YAML
            </button>
          </div>
          <pre className="font-mono-custom text-emerald-400 text-xs overflow-x-auto p-2 leading-relaxed max-h-[500px]">
            {rawConfigYml}
          </pre>
        </div>
      )}
    </div>
  );
};
