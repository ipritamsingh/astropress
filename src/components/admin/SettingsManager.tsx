import React, { useState, useEffect } from 'react';
import { ThemeSettings, SiteSettings } from '../../types/cms';
import { Settings, Save, Check, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  onUpdateSettings: (settings: Partial<ThemeSettings>) => void;
  onUpdateSiteSettings?: (settings: Partial<SiteSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsManager: React.FC<Props> = ({
  themeSettings,
  siteSettings,
  onUpdateSettings,
  onUpdateSiteSettings,
  onResetDefaults,
}) => {
  const [siteName, setSiteName] = useState(siteSettings?.siteTitle || themeSettings.siteName);
  const [tagline, setTagline] = useState(siteSettings?.siteTagline || themeSettings.tagline);
  const [adminEmail, setAdminEmail] = useState('amitsinghpritam@gmail.com');
  const [postsPerPage, setPostsPerPage] = useState(siteSettings?.postsPerPage || 6);
  const [permalinkStructure, setPermalinkStructure] = useState(
    siteSettings?.permalinkStructure || '/%postname%/'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (siteSettings?.permalinkStructure) {
      setPermalinkStructure(siteSettings.permalinkStructure);
    }
    if (siteSettings?.siteTitle) {
      setSiteName(siteSettings.siteTitle);
    }
    if (siteSettings?.siteTagline) {
      setTagline(siteSettings.siteTagline);
    }
    if (siteSettings?.postsPerPage) {
      setPostsPerPage(siteSettings.postsPerPage);
    }
  }, [siteSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ siteName, tagline });
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings({
        siteTitle: siteName,
        siteTagline: tagline,
        postsPerPage,
        permalinkStructure,
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Website Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure site metadata, reading options, and permalink structures
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* General Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          General Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <label className="font-semibold text-slate-700">Site Title</label>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <label className="font-semibold text-slate-700">Tagline</label>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">In a few words, explain what this site is about.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <label className="font-semibold text-slate-700">Administration Email Address</label>
          <div className="sm:col-span-2">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reading Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Reading & Pagination Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <label className="font-semibold text-slate-700">Blog pages show at most</label>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={24}
              value={postsPerPage}
              onChange={(e) => setPostsPerPage(parseInt(e.target.value) || 6)}
              className="w-20 p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            />
            <span className="text-slate-500">posts</span>
          </div>
        </div>
      </div>

      {/* Permalinks Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Permalink Structure
        </h3>
        <p className="text-slate-500">
          Astro uses static routing mapped to content slugs. Select your URL structure:
        </p>
        <div className="space-y-2">
          {[
            { label: 'Post name (Root-level)', format: '/%postname%/' },
            { label: 'Post name', format: '/posts/%postname%/' },
            { label: 'Day and name', format: '/%year%/%month%/%day%/%postname%/' },
            { label: 'Numeric ID', format: '/archives/%post_id%/' },
          ].map((item) => (
            <label
              key={item.format}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                permalinkStructure === item.format
                  ? 'bg-blue-50 border-blue-400 font-bold text-blue-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="permalink"
                checked={permalinkStructure === item.format}
                onChange={() => setPermalinkStructure(item.format)}
                className="text-blue-600"
              />
              <div>
                <span className="block">{item.label}</span>
                <code className="text-[11px] text-slate-400 font-mono">{item.format}</code>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Factory Reset Card */}
      <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Reset Demo Content to Initial Seeds</span>
          </h4>
          <p className="text-rose-700 text-xs mt-0.5">
            Reverts all posts, pages, categories, and customizer settings to default factory seeds.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all data to default seeds?')) {
              onResetDefaults();
              alert('Reset complete!');
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
