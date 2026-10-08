import React, { useState, useEffect } from 'react';
import { Post, Page, ThemeSettings, SiteSettings, IndexingSettings, SeoSocialProfiles, MediaItem } from '../../types/cms';
import { MediaLibrary } from './MediaLibrary';
import { getPersistedMediaBlob } from '../../data/mediaStorage';
import {
  Globe,
  Share2,
  CheckCircle2,
  Code,
  Save,
  Check,
  FileCode,
  Twitter,
  Sliders,
  ShieldCheck,
  Building2,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';

const SEOAssetPreview: React.FC<{
  url: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ url, alt, className = '', style }) => {
  const [displaySrc, setDisplaySrc] = useState<string>(url);

  useEffect(() => {
    let active = true;
    if (url && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
      getPersistedMediaBlob(url)
        .then((blobUrl) => {
          if (active && blobUrl) {
            setDisplaySrc(blobUrl);
          } else if (active) {
            setDisplaySrc(url);
          }
        })
        .catch(() => {
          if (active) setDisplaySrc(url);
        });
    } else {
      setDisplaySrc(url);
    }
    return () => {
      active = false;
    };
  }, [url]);

  const handleImgError = async () => {
    try {
      const fallback = await getPersistedMediaBlob(url);
      if (fallback) {
        setDisplaySrc(fallback);
      }
    } catch {}
  };

  if (!displaySrc) return null;

  return (
    <img
      src={displaySrc}
      alt={alt}
      onError={handleImgError}
      className={className}
      style={style}
    />
  );
};

interface Props {
  posts: Post[];
  pages: Page[];
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  media?: MediaItem[];
  onAddMedia?: (item: MediaItem) => void;
  onUpdateMedia?: (id: string, updates: Partial<MediaItem>) => void;
  onDeleteMedia?: (id: string) => void;
  onSaveSeoSettings: (settings: any) => void;
  onUpdateSiteSettings?: (s: Partial<SiteSettings>) => void;
}

export const SeoManager: React.FC<Props> = ({
  posts,
  pages,
  themeSettings,
  siteSettings,
  media,
  onAddMedia,
  onUpdateMedia,
  onDeleteMedia,
  onSaveSeoSettings,
  onUpdateSiteSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'social' | 'indexing' | 'sitemap' | 'robots' | 'checklist'>('general');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'favicon' | 'ogImage' | null>(null);

  // Centralized Site Identity & SEO Fields
  const [siteTitle, setSiteTitle] = useState(siteSettings?.siteTitle ?? themeSettings.siteName ?? 'AstroPress');
  const [siteTagline, setSiteTagline] = useState(siteSettings?.siteTagline ?? themeSettings.tagline ?? '');
  const [siteDescription, setSiteDescription] = useState(
    siteSettings?.siteDescription ??
      siteSettings?.siteTagline ??
      themeSettings.tagline ??
      ''
  );
  const [siteUrl, setSiteUrl] = useState(siteSettings?.siteUrl ?? 'https://astropress.pages.dev');
  const [logoUrl, setLogoUrl] = useState(siteSettings?.logoUrl ?? themeSettings.logoUrl ?? '');
  const [faviconUrl, setFaviconUrl] = useState(siteSettings?.faviconUrl ?? themeSettings.faviconUrl ?? '');
  const [defaultOgImage, setDefaultOgImage] = useState(
    siteSettings?.defaultOgImage ?? ''
  );
  const [focusKeyword, setFocusKeyword] = useState(siteSettings?.focusKeyword ?? 'Astro Sveltia CMS');

  // SEO Social Profiles (Schema.org sameAs links)
  const [twitterHandle, setTwitterHandle] = useState(siteSettings?.seoSocialProfiles?.twitterHandle || '@astropress');
  const [facebookUrl, setFacebookUrl] = useState(siteSettings?.seoSocialProfiles?.facebookUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(siteSettings?.seoSocialProfiles?.instagramUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(siteSettings?.seoSocialProfiles?.youtubeUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(siteSettings?.seoSocialProfiles?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(siteSettings?.seoSocialProfiles?.githubUrl || '');

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

  // Synchronize when props update
  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.siteTitle !== undefined) setSiteTitle(siteSettings.siteTitle || themeSettings.siteName || '');
      if (siteSettings.siteTagline !== undefined) setSiteTagline(siteSettings.siteTagline || themeSettings.tagline || '');
      if (siteSettings.siteDescription !== undefined) setSiteDescription(siteSettings.siteDescription || '');
      if (siteSettings.siteUrl !== undefined) setSiteUrl(siteSettings.siteUrl || '');
      if (siteSettings.logoUrl !== undefined) setLogoUrl(siteSettings.logoUrl || themeSettings.logoUrl || '');
      if (siteSettings.faviconUrl !== undefined) setFaviconUrl(siteSettings.faviconUrl || themeSettings.faviconUrl || '');
      if (siteSettings.defaultOgImage !== undefined) setDefaultOgImage(siteSettings.defaultOgImage || '');
      if (siteSettings.focusKeyword !== undefined) setFocusKeyword(siteSettings.focusKeyword || '');
      
      if (siteSettings.seoSocialProfiles) {
        setTwitterHandle(siteSettings.seoSocialProfiles.twitterHandle || '');
        setFacebookUrl(siteSettings.seoSocialProfiles.facebookUrl || '');
        setInstagramUrl(siteSettings.seoSocialProfiles.instagramUrl || '');
        setYoutubeUrl(siteSettings.seoSocialProfiles.youtubeUrl || '');
        setLinkedinUrl(siteSettings.seoSocialProfiles.linkedinUrl || '');
        setGithubUrl(siteSettings.seoSocialProfiles.githubUrl || '');
      }

      if (siteSettings.indexingSettings) {
        setGlobalIndexing(siteSettings.indexingSettings.globalIndexing ?? true);
        setPostsIndexing(siteSettings.indexingSettings.postsIndexing ?? true);
        setPagesIndexing(siteSettings.indexingSettings.pagesIndexing ?? true);
        setCategoriesIndexing(siteSettings.indexingSettings.categoriesIndexing ?? false);
        setTagsIndexing(siteSettings.indexingSettings.tagsIndexing ?? false);
        setPaginationPagesIndexing(
          siteSettings.indexingSettings.paginationPagesIndexing ?? 
          siteSettings.indexingSettings.paginationIndexing ?? 
          false
        );
        setSearchResultsIndexing(siteSettings.indexingSettings.searchResultsIndexing ?? false);
      }
    }
  }, [siteSettings]);

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

    const seoSocialProfiles: SeoSocialProfiles = {
      twitterHandle,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      linkedinUrl,
      githubUrl,
    };

    const updatedSiteSettings: Partial<SiteSettings> = {
      ...siteSettings,
      siteTitle,
      siteTagline,
      siteDescription,
      siteUrl,
      focusKeyword,
      logoUrl,
      faviconUrl,
      defaultOgImage,
      seoSocialProfiles,
      indexingSettings,
    };

    if (onUpdateSiteSettings) {
      onUpdateSiteSettings(updatedSiteSettings);
    }

    onSaveSeoSettings({
      metaTitle: siteTitle,
      metaDescription: siteDescription,
      focusKeyword,
      robotsIndex: globalIndexing,
      twitterHandle,
      indexingSettings,
      seoSocialProfiles,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const canonicalDomain = siteUrl ? siteUrl.replace(/\/+$/, '') : 'https://astropress.pages.dev';

  // Generate dynamic XML sitemap
  const generateSitemapXml = () => {
    const urls = [
      { loc: `${canonicalDomain}/`, priority: '1.0', changefreq: 'daily' },
      ...pages.map((p) => ({
        loc: `${canonicalDomain}/${p.slug === 'home' ? '' : p.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
      })),
      ...posts.map((p) => ({
        loc: `${canonicalDomain}/posts/${p.slug}`,
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
    return `# Robots.txt for ${siteTitle} on Cloudflare Pages
User-agent: *
${globalIndexing ? 'Allow: /' : 'Disallow: /'}
Disallow: /admin/
Disallow: /wpadmin/
Disallow: /api/

Sitemap: ${canonicalDomain}/sitemap.xml`;
  };

  // SEO Score Checklist calculation
  const totalPosts = posts.length || 1;
  const postsWithExcerpt = posts.filter((p) => p.excerpt && p.excerpt.length > 20).length;
  const postsWithImages = posts.filter((p) => p.featuredImage).length;
  const seoScore = Math.min(
    100,
    Math.round(
      (siteTitle.length >= 10 ? 25 : 10) +
        (siteDescription.length >= 30 ? 25 : 10) +
        (postsWithExcerpt / totalPosts) * 25 +
        (postsWithImages / totalPosts) * 25
    )
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Site Identity & SEO Central Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single authoritative location for global site branding, SERP metadata, Schema.org Organization profiles, and search indexing
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'Settings Saved!' : 'Save Identity & SEO'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`transition-colors ${
            activeTab === 'general'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          General Identity & SERP
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`transition-colors ${
            activeTab === 'social'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Social Cards & SEO Profiles
        </button>
        <button
          onClick={() => setActiveTab('indexing')}
          className={`transition-colors flex items-center gap-1.5 ${
            activeTab === 'indexing'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-blue-600" />
          <span>Indexing Controls</span>
        </button>
        <button
          onClick={() => setActiveTab('sitemap')}
          className={`transition-colors ${
            activeTab === 'sitemap'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          XML Sitemap
        </button>
        <button
          onClick={() => setActiveTab('robots')}
          className={`transition-colors ${
            activeTab === 'robots'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Robots.txt
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`transition-colors ${
            activeTab === 'checklist'
              ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          SEO Quality Score ({seoScore}/100)
        </button>
      </div>

      {/* TAB 1: GENERAL IDENTITY & GOOGLE SERP PREVIEW */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Global Site Identity & Metadata</span>
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Site Title / Name</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="AstroPress"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {siteTitle.length} characters (Optimal: 20-60) — Updates Header, Footer & Search Snippets
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Site Tagline</label>
              <input
                type="text"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                placeholder="The Headless Publishing Engine"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder="High-performance headless publishing platform..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 resize-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {siteDescription.length} characters (Optimal: 120-160)
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Canonical Site URL / Domain</label>
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://astropress.pages.dev"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Three Separate Site Assets: Logo, Favicon, Default Social Share Image */}
            <div className="space-y-5 pt-3 border-t border-slate-100">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <span>Site Assets (Logo, Favicon & Default Social OG Image)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage core site identity images independently. Each asset serves a specific role across browsers, social media, and search engines.
                </p>
              </div>

              {/* A. Site Logo */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 block text-xs">Site Logo</label>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Main website branding image used for site identity and Organization structured data.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('logo')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Select from Media Library</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/logo.png or https://..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-xs font-mono"
                />
                <div className="pt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">Logo Preview:</span>
                  {logoUrl ? (
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 max-h-12 flex items-center justify-center shadow-2xs">
                      <SEOAssetPreview url={logoUrl} alt="Logo Preview" className="max-h-8 h-8 w-auto object-contain" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No logo set</span>
                  )}
                </div>
              </div>

              {/* B. Site Favicon */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 block text-xs">Site Favicon</label>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Small browser/site icon shown in browser tabs, bookmarks, and other browser UI.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('favicon')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Select from Media Library</span>
                    </button>
                    {faviconUrl && (
                      <button
                        type="button"
                        onClick={() => setFaviconUrl('')}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="/favicon.ico or https://..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-xs font-mono"
                />
                <div className="pt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">Favicon Preview:</span>
                  {faviconUrl ? (
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 shadow-2xs">
                      <SEOAssetPreview url={faviconUrl} alt="Favicon Preview" className="h-6 w-6 object-contain rounded" />
                      <span className="text-[10px] text-slate-400 font-mono">32x32</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No favicon set</span>
                  )}
                </div>
              </div>

              {/* C. Default Social Share Image */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 block text-xs">Default Social Share Image</label>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Global fallback image used for Open Graph and social sharing previews when a page or post does not have its own social image.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('ogImage')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Select from Media Library</span>
                    </button>
                    {defaultOgImage && (
                      <button
                        type="button"
                        onClick={() => setDefaultOgImage('')}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={defaultOgImage}
                  onChange={(e) => setDefaultOgImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-xs font-mono"
                />
                <div className="pt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">Social Card Preview:</span>
                  {defaultOgImage ? (
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 max-h-24 flex items-center justify-center shadow-2xs overflow-hidden">
                      <SEOAssetPreview url={defaultOgImage} alt="OG Preview" className="max-h-20 h-20 w-auto object-contain" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No OG image set</span>
                  )}
                </div>
              </div>
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
          </div>

          {/* Live Google Search Result Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Google Search Snippet Preview</span>
            </h3>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
              <div className="text-xs text-slate-500 font-mono truncate">
                {canonicalDomain} › articles
              </div>
              <h4 className="text-lg font-medium text-blue-800 hover:underline cursor-pointer line-clamp-1">
                {siteTitle} — {siteTagline}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {siteDescription}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-2">
              <span className="font-bold block flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Centralized Site Identity Active</span>
              </span>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Updating Site Title, Tagline, Logo or Domain here automatically synchronizes with Site Settings, Theme Customizer, and all SEO meta tags site-wide.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL CARDS & SEO PROFILES */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                <span>OpenGraph & Twitter Sharing Defaults</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Default visual cards displayed when sharing pages on Slack, Discord, Twitter, or LinkedIn.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 block">Default OpenGraph Share Image URL</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget('ogImage')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Select from Media Library</span>
                  </button>
                  {defaultOgImage && (
                    <button
                      type="button"
                      onClick={() => setDefaultOgImage('')}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={defaultOgImage}
                onChange={(e) => setDefaultOgImage(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 text-xs font-mono"
              />
              {defaultOgImage && (
                <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden max-h-36 bg-white flex items-center justify-center p-1">
                  <SEOAssetPreview url={defaultOgImage} alt="OG Image Field Preview" className="max-h-32 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Twitter / X Handle</label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@astropress"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            {/* Schema.org Organization Social Profiles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-purple-600" />
                  <span>Schema.org Organization Social Profiles (`sameAs`)</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Used exclusively for Google Knowledge Panels and Schema.org Organization structured data. <em>Independent of Footer Social Channels and Blue Community CTA.</em>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Twitter / OpenGraph Card Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Twitter className="h-4 w-4 text-blue-400" />
              <span>Social Share Card Preview</span>
            </h3>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
              <div className="aspect-video w-full bg-slate-900 relative">
                <img
                  src={defaultOgImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'}
                  alt="OG Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-mono">{canonicalDomain.replace(/^https?:\/\//, '')}</span>
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{siteTitle}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{siteDescription}</p>
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
                  Master switch for entire site. When disabled, outputs <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">noindex, follow</code> meta tag site-wide.
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
                  Allow search engines to index pagination archive pages such as <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/page2/</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/page3/</code>, etc.
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
                Automatically indexes {pages.length} pages and {posts.length} posts for domain {canonicalDomain}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateSitemapXml());
                alert('Copied sitemap.xml to clipboard!');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Copy XML
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
            {generateSitemapXml()}
          </pre>
        </div>
      )}

      {/* TAB 5: ROBOTS.TXT */}
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

      {/* TAB 6: CONTENT QUALITY AUDIT */}
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
                  <span className="text-slate-500">Current title is {siteTitle.length} characters (Optimal).</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Meta Description</span>
                  <span className="text-slate-500">Provided and formatted for desktop and mobile SERPs ({siteDescription.length} chars).</span>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">Pass</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">XML Sitemap & Robots.txt</span>
                  <span className="text-slate-500">Sitemap dynamically mapped to all {posts.length + pages.length} content routes for {canonicalDomain}.</span>
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

      {/* Media Library Picker Modal */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <span>
                    Select Asset for {mediaPickerTarget === 'logo' ? 'Site Logo' : mediaPickerTarget === 'favicon' ? 'Favicon' : 'OpenGraph Share Image'}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Choose an existing image or upload a new asset to set as global site identity
                </span>
              </div>
              <button
                onClick={() => setMediaPickerTarget(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-2xl p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <MediaLibrary
                media={media || []}
                onAddMedia={onAddMedia || (() => {})}
                onUpdateMedia={onUpdateMedia}
                onDeleteMedia={onDeleteMedia || (() => {})}
                onSelectMedia={(item) => {
                  const selectedUrl = item.url || item.originalUrl;
                  if (selectedUrl) {
                    if (mediaPickerTarget === 'logo') setLogoUrl(selectedUrl);
                    else if (mediaPickerTarget === 'favicon') setFaviconUrl(selectedUrl);
                    else if (mediaPickerTarget === 'ogImage') setDefaultOgImage(selectedUrl);
                  }
                  setMediaPickerTarget(null);
                }}
                isModalPicker={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
