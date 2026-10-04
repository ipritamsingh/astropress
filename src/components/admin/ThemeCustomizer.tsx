import React, { useState } from 'react';
import { ThemeSettings, HomepageSection, Post, Category } from '../../types/cms';
import {
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Save,
  ArrowLeft,
  Palette,
  Layout,
  Type,
  Sliders,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { HomepageView } from '../frontend/HomepageView';

interface Props {
  settings: ThemeSettings;
  homepageSections: HomepageSection[];
  posts: Post[];
  categories: Category[];
  onSaveSettings: (settings: Partial<ThemeSettings>) => void;
  onSaveHomepageSections: (sections: HomepageSection[]) => void;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<Props> = ({
  settings,
  homepageSections,
  posts,
  categories,
  onSaveSettings,
  onSaveHomepageSections,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<ThemeSettings>(settings);
  const [localSections, setLocalSections] = useState<HomepageSection[]>(homepageSections);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState<
    'identity' | 'colors' | 'typography' | 'header' | 'footer' | 'homepage'
  >('identity');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePublish = () => {
    onSaveSettings(localSettings);
    onSaveHomepageSections(localSections);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const colorPresets = [
    { name: 'Editorial Blue', primary: '#2563eb', accent: '#f59e0b', bg: '#f8fafc', text: '#0f172a' },
    { name: 'Nordic Emerald', primary: '#059669', accent: '#10b981', bg: '#f0fdf4', text: '#064e3b' },
    { name: 'Indigo Modern', primary: '#4f46e5', accent: '#ec4899', bg: '#f5f3ff', text: '#1e1b4b' },
    { name: 'Warm Amber Serif', primary: '#b45309', accent: '#d97706', bg: '#fffbeb', text: '#451a03' },
    { name: 'Monochrome Slate', primary: '#0f172a', accent: '#64748b', bg: '#f8fafc', text: '#020617' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col font-sans select-none">
      {/* Top Customizer Header */}
      <header className="h-14 bg-slate-950 text-white border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Close Customizer</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Customizing:</span>
            <span className="text-xs bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded-md border border-blue-700/50">
              {localSettings.siteName}
            </span>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'desktop' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop Mode"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewDevice('tablet')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'tablet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet Mode"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'mobile' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile Mode"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Publish Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs md:text-sm shadow-md transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Body: Left Controls + Right Live Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Drawer */}
        <div className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-100 overflow-y-auto">
          {/* Navigation Accordion Sections */}
          <div className="p-3 border-b border-slate-800 space-y-1">
            <button
              onClick={() => setActiveSection('identity')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'identity'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 text-blue-400" />
                <span>Site Identity</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveSection('colors')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'colors'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Palette className="h-4 w-4 text-amber-400" />
                <span>Colors & Palette</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveSection('typography')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'typography'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="h-4 w-4 text-emerald-400" />
                <span>Typography & Layout</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveSection('header')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'header'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layout className="h-4 w-4 text-purple-400" />
                <span>Header Builder</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveSection('footer')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'footer'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layout className="h-4 w-4 text-rose-400" />
                <span>Footer Builder</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveSection('homepage')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                activeSection === 'homepage'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span>Homepage Sections</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
          </div>

          {/* Active Section Panel Controls */}
          <div className="p-4 space-y-6 flex-1">
            {/* SITE IDENTITY */}
            {activeSection === 'identity' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Site Title & Tagline</h4>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Site Title</label>
                  <input
                    type="text"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={localSettings.tagline}
                    onChange={(e) => setLocalSettings({ ...localSettings, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Container Width</label>
                  <select
                    value={localSettings.containerWidth}
                    onChange={(e) => setLocalSettings({ ...localSettings, containerWidth: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="narrow">Narrow (1024px)</option>
                    <option value="normal">Normal (1280px)</option>
                    <option value="wide">Wide (1440px)</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
              </div>
            )}

            {/* COLORS */}
            {activeSection === 'colors' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Preset Palettes</h4>
                  <div className="space-y-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            primaryColor: preset.primary,
                            accentColor: preset.accent,
                            backgroundColor: preset.bg,
                            textColor: preset.text,
                          })
                        }
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
                      >
                        <span className="font-medium text-slate-200">{preset.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                          <span className="h-4 w-4 rounded-full border border-slate-700" style={{ backgroundColor: preset.bg }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Colors</h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Primary Brand Color</span>
                    <input
                      type="color"
                      value={localSettings.primaryColor}
                      onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Accent Color</span>
                    <input
                      type="color"
                      value={localSettings.accentColor}
                      onChange={(e) => setLocalSettings({ ...localSettings, accentColor: e.target.value })}
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Page Background</span>
                    <input
                      type="color"
                      value={localSettings.backgroundColor}
                      onChange={(e) => setLocalSettings({ ...localSettings, backgroundColor: e.target.value })}
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TYPOGRAPHY */}
            {activeSection === 'typography' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fonts & Styling</h4>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Heading Font Family</label>
                  <select
                    value={localSettings.headingFont}
                    onChange={(e) => setLocalSettings({ ...localSettings, headingFont: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean)</option>
                    <option value="Source Serif 4">Source Serif 4 (Editorial Classic)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                    <option value="System UI">System UI Native</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Body Font Family</label>
                  <select
                    value={localSettings.bodyFont}
                    onChange={(e) => setLocalSettings({ ...localSettings, bodyFont: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Source Serif 4">Source Serif 4</option>
                    <option value="System UI">System UI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Global Border Radius</label>
                  <select
                    value={localSettings.borderRadius}
                    onChange={(e) => setLocalSettings({ ...localSettings, borderRadius: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="none">Sharp (0px)</option>
                    <option value="sm">Subtle (4px)</option>
                    <option value="md">Rounded (8px)</option>
                    <option value="lg">Smooth (16px)</option>
                    <option value="full">Pill / Full</option>
                  </select>
                </div>
              </div>
            )}

            {/* HEADER BUILDER */}
            {activeSection === 'header' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Header Configuration</h4>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Header Layout</label>
                  <select
                    value={localSettings.header.layout}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        header: { ...localSettings.header, layout: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="standard">Standard (Logo Left, Nav Center, CTA Right)</option>
                    <option value="centered">Centered (Logo Top Center, Nav Below)</option>
                    <option value="split">Split Navigation</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Sticky On Scroll</span>
                  <input
                    type="checkbox"
                    checked={localSettings.header.sticky}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        header: { ...localSettings.header, sticky: e.target.checked },
                      })
                    }
                    className="rounded h-4 w-4 text-blue-600 bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Show Search Icon</span>
                  <input
                    type="checkbox"
                    checked={localSettings.header.showSearch}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        header: { ...localSettings.header, showSearch: e.target.checked },
                      })
                    }
                    className="rounded h-4 w-4 text-blue-600 bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Show Header CTA Button</span>
                  <input
                    type="checkbox"
                    checked={localSettings.header.showCta}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        header: { ...localSettings.header, showCta: e.target.checked },
                      })
                    }
                    className="rounded h-4 w-4 text-blue-600 bg-slate-950 border-slate-700"
                  />
                </div>
                {localSettings.header.showCta && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={localSettings.header.ctaText}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          header: { ...localSettings.header, ctaText: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* FOOTER BUILDER */}
            {activeSection === 'footer' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Footer Configuration</h4>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Footer Columns</label>
                  <select
                    value={localSettings.footer.columns}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        footer: { ...localSettings.footer, columns: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value={1}>1 Column (Minimal Centered)</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns (Full Magazine)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Copyright Notice</label>
                  <textarea
                    value={localSettings.footer.copyright}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        footer: { ...localSettings.footer, copyright: e.target.value },
                      })
                    }
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Show Newsletter Box</span>
                  <input
                    type="checkbox"
                    checked={localSettings.footer.showNewsletter}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        footer: { ...localSettings.footer, showNewsletter: e.target.checked },
                      })
                    }
                    className="rounded h-4 w-4 text-blue-600 bg-slate-950 border-slate-700"
                  />
                </div>
              </div>
            )}

            {/* HOMEPAGE SECTIONS */}
            {activeSection === 'homepage' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reorderable Sections</h4>
                <div className="space-y-2">
                  {localSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{sec.title || sec.type}</span>
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={(e) => {
                            const updated = [...localSections];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            setLocalSections(updated);
                          }}
                          className="rounded h-4 w-4 text-blue-600 bg-slate-900 border-slate-700"
                        />
                      </div>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...localSections];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setLocalSections(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-md p-1.5 text-[11px] text-slate-300"
                        placeholder="Section Heading"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview Frame */}
        <div className="flex-1 bg-slate-950 p-4 md:p-8 flex items-center justify-center overflow-hidden">
          <div
            className={`h-full bg-white rounded-2xl shadow-2xl overflow-y-auto transition-all duration-300 border border-slate-800 ${
              previewDevice === 'mobile'
                ? 'w-[375px]'
                : previewDevice === 'tablet'
                ? 'w-[768px]'
                : 'w-full'
            }`}
          >
            {/* Embedded Live Simulation with Dynamic Settings */}
            <div
              style={{
                backgroundColor: localSettings.backgroundColor,
                color: localSettings.textColor,
                fontFamily:
                  localSettings.bodyFont === 'Source Serif 4'
                    ? "'Source Serif 4', Georgia, serif"
                    : "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
              className="min-h-full"
            >
              <HomepageView
                posts={posts}
                categories={categories}
                sections={localSections}
                themeSettings={localSettings}
                onSelectPost={() => {}}
                onSelectCategory={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
