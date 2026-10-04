import React, { useState } from 'react';
import { ThemeSettings, Menu, Category } from '../../types/cms';
import {
  Layout,
  Save,
  CheckCircle2,
  Sliders,
  Eye,
  Columns,
  Share2,
  Mail,
  FileText,
} from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  menus: Menu[];
  categories: Category[];
  onSaveTheme: (newSettings: Partial<ThemeSettings>) => void;
}

export const FooterBuilder: React.FC<Props> = ({
  themeSettings,
  menus,
  categories,
  onSaveTheme,
}) => {
  const [footerConfig, setFooterConfig] = useState(
    themeSettings.footer || {
      columns: 4,
      copyright: '© 2026 AstroPress. Powered by Astro & Sveltia CMS on Cloudflare Pages.',
      showNewsletter: true,
      newsletterTitle: 'The Headless Dispatch',
      newsletterSubtitle: 'Weekly updates on Astro, Gutenberg blocks, and edge hosting.',
      showSocialLinks: true,
      customCredits: 'Built with Astro, React, and Sveltia CMS',
    }
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const footerMenu = menus.find((m) => m.location === 'footer') || menus[0];

  const handleSave = () => {
    onSaveTheme({
      footer: footerConfig,
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
            <span>Visual Footer Builder</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure footer columns, custom copyright, newsletter subscribe widget, and social badges.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Footer Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Footer Configuration</span>
            </>
          )}
        </button>
      </div>

      {/* Live Visual Preview */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-blue-600" />
          <span>Footer Live Appearance Preview</span>
        </span>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-slate-300 shadow-xl space-y-6">
          <div
            className={`grid gap-6 ${
              footerConfig.columns === 1
                ? 'grid-cols-1 text-center'
                : footerConfig.columns === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : footerConfig.columns === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {/* Col 1: Brand Info */}
            <div className="space-y-2">
              <span className="font-extrabold text-white text-base block">{themeSettings.siteName}</span>
              <p className="text-xs text-slate-400">{themeSettings.tagline}</p>
              {footerConfig.showSocialLinks && (
                <div className="flex gap-2 pt-2 text-xs text-blue-400">
                  <span>• GitHub</span>
                  <span>• Twitter</span>
                  <span>• Cloudflare</span>
                </div>
              )}
            </div>

            {/* Col 2: Navigation */}
            {footerConfig.columns >= 2 && (
              <div className="space-y-2">
                <span className="font-bold text-xs uppercase text-slate-100 block">Navigation</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {footerMenu?.items?.slice(0, 4).map((i) => (
                    <li key={i.id}>{i.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Col 3: Categories */}
            {footerConfig.columns >= 3 && (
              <div className="space-y-2">
                <span className="font-bold text-xs uppercase text-slate-100 block">Topics</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {categories.slice(0, 4).map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Col 4: Newsletter */}
            {footerConfig.columns >= 4 && footerConfig.showNewsletter && (
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-xs text-white block">{footerConfig.newsletterTitle}</span>
                <p className="text-[11px] text-slate-400">{footerConfig.newsletterSubtitle}</p>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="email"
                    placeholder="Enter email..."
                    readOnly
                    className="flex-1 bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded text-slate-400"
                  />
                  <button className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded">
                    Join
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>{footerConfig.copyright}</span>
            <span>{footerConfig.customCredits || 'AstroPress CMS'}</span>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Layout & Columns */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Columns className="h-4 w-4 text-blue-600" />
            <span>Layout Columns & Options</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Footer Columns Count ({footerConfig.columns})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFooterConfig({ ...footerConfig, columns: n })}
                    className={`py-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      footerConfig.columns === n
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n} {n === 1 ? 'Column' : 'Cols'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Social Media Badges</span>
                <span className="text-[10px] text-slate-500">
                  Displays GitHub, Twitter, and website icons
                </span>
              </div>
              <input
                type="checkbox"
                checked={footerConfig.showSocialLinks}
                onChange={(e) => setFooterConfig({ ...footerConfig, showSocialLinks: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Newsletter Subscribe Box</span>
                <span className="text-[10px] text-slate-500">
                  Includes email capture in the footer column
                </span>
              </div>
              <input
                type="checkbox"
                checked={footerConfig.showNewsletter}
                onChange={(e) => setFooterConfig({ ...footerConfig, showNewsletter: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Text & Copyright */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Copyright & Editorial Credits</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Copyright Line</label>
              <textarea
                rows={2}
                value={footerConfig.copyright}
                onChange={(e) => setFooterConfig({ ...footerConfig, copyright: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Custom Credits / Slogan</label>
              <input
                type="text"
                value={footerConfig.customCredits || ''}
                onChange={(e) => setFooterConfig({ ...footerConfig, customCredits: e.target.value })}
                placeholder="e.g. Crafted with Astro & Sveltia CMS"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            {footerConfig.showNewsletter && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">Newsletter Copy</span>
                <input
                  type="text"
                  value={footerConfig.newsletterTitle}
                  onChange={(e) => setFooterConfig({ ...footerConfig, newsletterTitle: e.target.value })}
                  placeholder="Newsletter Headline"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
                <textarea
                  rows={2}
                  value={footerConfig.newsletterSubtitle}
                  onChange={(e) => setFooterConfig({ ...footerConfig, newsletterSubtitle: e.target.value })}
                  placeholder="Newsletter description..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
