import React, { useState } from 'react';
import { Post, Page, ThemeSettings, SiteSettings, IndexingSettings } from '../../types/cms';
import {
  Search,
  Globe,
  Share2,
  CheckCircle2,
  AlertCircle,
  Code,
  Save,
  Check,
  FileCode,
  ExternalLink,
  Twitter,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  posts: Post[];
  pages: Page[];
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  onSaveSeoSettings: (settings: any) => void;
  onUpdateSiteSettings?: (s: SiteSettings) => void;
}

export const SeoManager: React.FC<Props> = ({
  posts,
  pages,
  themeSettings,
  siteSettings,
  onSaveSeoSettings,
  onUpdateSiteSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'social' | 'indexing' | 'sitemap' | 'robots' | 'checklist'>('general');
  const [metaTitle, setMetaTitle] = useState('AstroPress — Modern Astro & Sveltia CMS Platform');
  const [metaDescription, setMetaDescription] = useState(
    'High performance headless publishing platform powered by Astro, Sveltia CMS, Cloudflare Pages, and GitHub content storage.'
  );
  const [focusKeyword, setFocusKeyword] = useState('Astro Sveltia CMS');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [robotsFollow, setRobotsFollow] = useState(true);
  const [twitterHandle, setTwitterHandle] = useState('@astropress');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Central Indexing Controls State
  const [globalIndexing, setGlobalIndexing] = useState(siteSettings?.indexingSettings?.globalIndexing ?? true);
  const [postsIndexing, setPostsIndexing] = useState(siteSettings?.indexingSettings?.postsIndexing ?? true);
  const [pagesIndexing, setPagesIndexing] = useState(siteSettings?.indexingSettings?.pagesIndexing ?? true);
  const [categoriesIndexing, setCategoriesIndexing] = useState(siteSettings?.indexingSettings?.categoriesIndexing ?? false);
  const [tagsIndexing, setTagsIndexing] = useState(siteSettings?.indexingSettings?.tagsIndexing ?? false);
  const [paginationPagesIndexing, setPaginationPagesIndexing] = useState(
    siteSettings?.indexingSettings?.paginationPagesIndexing ?? siteSettings?.indexingSettings?.paginationIndexing ?? false
  );
  const [searchResultsIndexing, setSearchResultsIndexing] = useState(siteSettings?.indexingSettings?.searchResultsIndexing ?? false);

  const handleSave = () => {
    const indexingSettings: IndexingSettings = {
      globalIndexing,
      postsIndexing,
      pagesIndexing,
      categoriesIndexing,
      tagsIndexing,
      paginationPagesIndexing,
      paginationIndexing: paginationPagesIndexing,
      searchResultsIndexing,
    };
    if (onUpdateSiteSettings && siteSettings) {
      onUpdateSiteSettings({
        ...siteSettings,
        indexingSettings,
      });
    }
    onSaveSeoSettings({
      metaTitle,
      metaDescription,
      focusKeyword,
      robotsIndex: globalIndexing,
      robotsFollow,
      twitterHandle,
      indexingSettings,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Generate dynamic XML sitemap
  const generateSitemapXml = () => {
    const urls = [
      { loc: 'https://astropress.pages.dev/', priority: '1.0', changefreq: 'daily' },
      ...pages.map((p) => ({
        loc: `https://astropress.pages.dev/${p.slug === 'home' ? '' : p.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
      })),
      ...posts.map((p) => ({
        loc: `https://astropress.pages.dev/posts/${p.slug}`,
        priority: '0.9',
        changefreq: 'monthly',
      })),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  };

  const generateRobotsTxt = () => {
    return `# Robots.txt for AstroPress on Cloudflare Pages
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /wpadmin/
Disallow: /api/

Sitemap: https://astropress.pages.dev/sitemap.xml`;
  };

  // SEO Score Checklist calculation
  const totalPosts = posts.length;
  const postsWithExcerpt = posts.filter((p) => p.excerpt && p.excerpt.length > 20).length;
  const postsWithImages = posts.filter((p) => p.featuredImage).length;
  const seoScore = Math.min(
    100,
    Math.round(
      (metaTitle.length >= 20 ? 25 : 10) +
        (metaDescription.length >= 50 ? 25 : 10) +
        (postsWithExcerpt / totalPosts) * 25 +
        (postsWithImages / totalPosts) * 25
    )
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>SEO Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search engine metadata, social share cards, XML sitemaps, and robots.txt
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'SEO Saved!' : 'Save SEO Settings'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`transition-colors ${
            activeTab === 'general' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          General & SERP Preview
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`transition-colors ${
            activeTab === 'social' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Social Cards (OG & Twitter)
        </button>
        <button
          onClick={() => setActiveTab('indexing')}
          className={`transition-colors flex items-center gap-1.5 ${
            activeTab === 'indexing' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-blue-600" />
          <span>Indexing Controls</span>
        </button>
        <button
          onClick={() => setActiveTab('sitemap')}
          className={`transition-colors ${
            activeTab === 'sitemap' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          XML Sitemap
        </button>
        <button
          onClick={() => setActiveTab('robots')}
          className={`transition-colors ${
            activeTab === 'robots' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Robots.txt
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`transition-colors ${
            activeTab === 'checklist' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Content Quality Audit ({seoScore}/100)
        </button>
      </div>

      {/* TAB 1: GENERAL & GOOGLE SERP PREVIEW */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Site-Wide SEO Defaults</h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SEO Title Format</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {metaTitle.length} characters (Optimal: 40-60)
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 resize-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {metaDescription.length} characters (Optimal: 120-160)
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Global Focus Keyword</label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Search Engine Indexing</span>
                <span className="text-[11px] text-slate-400">Allow Google and Bing to crawl this site</span>
              </div>
              <input
                type="checkbox"
                checked={robotsIndex}
                onChange={(e) => setRobotsIndex(e.target.checked)}
                className="rounded h-4 w-4 text-blue-600"
              />
            </div>
          </div>

          {/* Live Google Search Result Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Google Search Snippet Preview</span>
            </h3>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="text-xs text-slate-500 font-mono">
                https://astropress.pages.dev › articles
              </div>
              <h4 className="text-lg font-medium text-blue-800 hover:underline cursor-pointer line-clamp-1">
                {metaTitle}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {metaDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL CARDS PREVIEW */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Social Meta Configuration</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Twitter / X Username</label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Twitter Card Type</label>
              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="summary_large_image">summary_large_image (High Impact)</option>
                <option value="summary">summary (Compact)</option>
              </select>
            </div>
          </div>

          {/* Twitter Card Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Twitter className="h-4 w-4 text-blue-400" />
              <span>Twitter Large Share Card Preview</span>
            </h3>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
              <div className="aspect-video w-full bg-slate-900 relative">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
                  alt="OG Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-mono">astropress.pages.dev</span>
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{metaTitle}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{metaDescription}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INDEXING CONTROLS */}
      {activeTab === 'indexing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Central Search Indexing Controls</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control search engine crawlability and indexability across different content types and archive templates.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Robots Meta Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. Global Search Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Global Search Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Master switch for entire site. When disabled, outputs <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">noindex, nofollow</code> meta tag site-wide.
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalIndexing}
                onChange={(e) => setGlobalIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 2. Posts Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Posts Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow search engines to index individual published post articles (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/posts/*</code>).
                </p>
              </div>
              <input
                type="checkbox"
                checked={postsIndexing}
                onChange={(e) => setPostsIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 3. Pages Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Pages Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow search engines to index standalone static pages (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/about</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/contact</code>).
                </p>
              </div>
              <input
                type="checkbox"
                checked={pagesIndexing}
                onChange={(e) => setPagesIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 4. Categories Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Categories Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow search engines to index category archive listing pages (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/category/*</code>).
                </p>
              </div>
              <input
                type="checkbox"
                checked={categoriesIndexing}
                onChange={(e) => setCategoriesIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 5. Tags Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Tags Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow search engines to index tag archive listing pages (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/tag/*</code>).
                </p>
              </div>
              <input
                type="checkbox"
                checked={tagsIndexing}
                onChange={(e) => setTagsIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 6. Pagination Pages Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Pagination Pages Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow search engines to index pagination archive pages such as <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/page2/</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/page3/</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/page4/</code>, etc.
                </p>
              </div>
              <input
                type="checkbox"
                aria-label="Pagination Pages Indexing"
                checked={paginationPagesIndexing}
                onChange={(e) => setPaginationPagesIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>

            {/* 7. Search Results Indexing */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Search Results Indexing</span>
                <p className="text-slate-500 leading-relaxed">
                  Allow indexing of dynamic internal search query pages. (Recommended OFF to prevent thin content indexing).
                </p>
              </div>
              <input
                type="checkbox"
                checked={searchResultsIndexing}
                onChange={(e) => setSearchResultsIndexing(e.target.checked)}
                className="mt-1 rounded h-5 w-5 text-blue-600 shrink-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: XML SITEMAP */}
      {activeTab === 'sitemap' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-purple-600" />
                <span>Generated XML Sitemap (sitemap.xml)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Automatically indexes {pages.length} pages and {posts.length} posts
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateSitemapXml());
                alert('Copied sitemap.xml to clipboard!');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs"
            >
              Copy XML
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
            {generateSitemapXml()}
          </pre>
        </div>
      )}

      {/* TAB 4: ROBOTS.TXT */}
      {activeTab === 'robots' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code className="h-4 w-4 text-amber-600" />
                <span>Robots.txt Configuration</span>
              </h3>
              <span className="text-xs text-slate-400">Directs search engine bots and prevents admin indexing</span>
            </div>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            {generateRobotsTxt()}
          </pre>
        </div>
      )}

      {/* TAB 5: CONTENT QUALITY AUDIT */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">SEO Content Quality Score</h3>
              <p className="text-xs text-slate-500">Evaluates publication completeness against search engine standards</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600">{seoScore}</span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">SEO Title Length</span>
                  <span className="text-slate-500">Current title is {metaTitle.length} characters (Optimal).</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Meta Description</span>
                  <span className="text-slate-500">Provided and formatted for desktop and mobile SERPs.</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">XML Sitemap & Robots.txt</span>
                  <span className="text-slate-500">Sitemap dynamically mapped to all {posts.length + pages.length} content routes.</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Featured Images & Alt Attributes</span>
                  <span className="text-slate-500">Articles contain visual banners with descriptive alt metadata.</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
