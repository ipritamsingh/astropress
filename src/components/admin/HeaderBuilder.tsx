import React, { useState, useEffect } from 'react';
import { ThemeSettings, Menu } from '../../types/cms';
import { initialThemeSettings } from '../../data/initialData';
import {
  Sliders,
  Eye,
  Save,
  CheckCircle2,
  Sparkles,
  Layout,
  Search,
  ShieldCheck,
  Globe,
  Share2,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  menus: Menu[];
  onSaveTheme: (newSettings: Partial<ThemeSettings>) => void;
}

export const HeaderBuilder: React.FC<Props> = ({ themeSettings, menus, onSaveTheme }) => {
  const [headerConfig, setHeaderConfig] = useState(
    {
      ...initialThemeSettings.header,
      ...themeSettings.header,
    }
  );
  const [siteName, setSiteName] = useState(themeSettings.siteName || 'AstroPress');
  const [logoUrl, setLogoUrl] = useState(themeSettings.logoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Synchronize with updated themeSettings props
  useEffect(() => {
    if (themeSettings) {
      if (themeSettings.siteName !== undefined) setSiteName(themeSettings.siteName || 'AstroPress');
      if (themeSettings.logoUrl !== undefined) setLogoUrl(themeSettings.logoUrl || '');
      if (themeSettings.header) setHeaderConfig({
        ...initialThemeSettings.header,
        ...themeSettings.header
      });
    }
  }, [themeSettings]);

  const headerMenu = menus.find((m) => m.location === 'header') || menus[0];

  const handleSave = () => {
    onSaveTheme({
      siteName,
      logoUrl,
      header: headerConfig,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layout className="h-6 w-6 text-blue-600" />
            <span>Visual Header Builder</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize header layout presets, navigation menus, logo, search bar, and action buttons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Header Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Header Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Interactive Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>Interactive Header Live Preview</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                previewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                previewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 shadow-inner flex justify-center">
          <div
            className={`transition-all duration-300 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${
              previewDevice === 'mobile' ? 'w-full max-w-[375px]' : 'w-full'
            }`}
          >
            {/* Header Rendering Preview */}
            <div
              className={`p-4 flex items-center justify-between gap-4 border-b border-slate-100 ${
                headerConfig.layout === 'centered' ? 'flex-col sm:flex-row' : ''
              }`}
            >
              {/* Logo / Title */}
              <div className="flex items-center gap-2.5 cursor-pointer shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="h-8 max-w-[120px] object-contain" />
                ) : (
                  <div
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
                  >
                    {siteName.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight block">
                    {siteName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block -mt-0.5">
                    {headerConfig.subtitle || 'Astro • Sveltia • Edge'}
                  </span>
                </div>
              </div>

              {/* Navigation items (hidden on mobile preview) */}
              {previewDevice === 'desktop' && (
                <nav className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  {headerMenu?.items?.slice(0, 4).map((item) => (
                    <span key={item.id} className="hover:text-blue-600 cursor-pointer">
                      {item.label}
                    </span>
                  ))}
                </nav>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {headerConfig.showSearch && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs">
                    <Search className="h-3 w-3" />
                    <span className="text-[10px]">Search</span>
                  </div>
                )}

                {headerConfig.showCta && (
                  <button
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="px-3 py-1 rounded-lg text-white font-bold text-xs shadow-xs"
                  >
                    {headerConfig.ctaText || 'CTA Button'}
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 text-center text-xs text-slate-400">
              Header preview rendered with {headerConfig.layout} layout
            </div>
          </div>
        </div>
      </div>

      {/* Header Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Layout & Style Presets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layout className="h-4 w-4 text-blue-600" />
            <span>Layout Presets & Behavior</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Header Layout Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'standard', name: 'Standard (Left-Right)' },
                  { id: 'centered', name: 'Centered Logo' },
                  { id: 'split', name: 'Split Navigation' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setHeaderConfig({ ...headerConfig, layout: l.id as any })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      headerConfig.layout === l.id
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Sticky Header</span>
                <span className="text-[10px] text-slate-500">
                  Fixed header remains visible while readers scroll down
                </span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.sticky}
                onChange={(e) => setHeaderConfig({ ...headerConfig, sticky: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Transparent on Homepage Hero</span>
                <span className="text-[10px] text-slate-500">
                  Overlays header directly on the hero banner image
                </span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.transparentOnHome}
                onChange={(e) => setHeaderConfig({ ...headerConfig, transparentOnHome: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Identity & Action Tools */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>Brand Identity & Header Widgets</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Site Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Brand Subtitle / Tagline</label>
              <input
                type="text"
                value={headerConfig.subtitle ?? ''}
                onChange={(e) => setHeaderConfig({ ...headerConfig, subtitle: e.target.value })}
                placeholder="Astro • Sveltia • Edge"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Displays directly beneath the site name in the public header across desktop and mobile.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Custom Logo URL (Optional)</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Search Bar</span>
                <input
                  type="checkbox"
                  checked={headerConfig.showSearch}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, showSearch: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">CTA Button</span>
                <input
                  type="checkbox"
                  checked={headerConfig.showCta}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, showCta: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>

            {headerConfig.showCta && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <div>
                  <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Button Text</label>
                  <input
                    type="text"
                    value={headerConfig.ctaText}
                    onChange={(e) => setHeaderConfig({ ...headerConfig, ctaText: e.target.value })}
                    className="w-full text-xs p-1.5 rounded-lg border border-blue-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Button URL</label>
                  <input
                    type="text"
                    value={headerConfig.ctaUrl}
                    onChange={(e) => setHeaderConfig({ ...headerConfig, ctaUrl: e.target.value })}
                    className="w-full text-xs p-1.5 rounded-lg border border-blue-200 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
