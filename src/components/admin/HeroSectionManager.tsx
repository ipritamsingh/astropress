import React, { useState } from 'react';
import { HeroSectionConfig, HeroTrustBadge, DeploymentSettings } from '../../types/cms';
import { HeroSection } from '../frontend/HeroSection';
import { initialHeroConfig } from '../../data/initialData';
import { sanitizeSvgContent } from '../common/HeroIllustrationSvg';
import { executePublishContent, PublishResult } from '../../data/githubPublishService';
import {
  Sparkles,
  Save,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  EyeOff,
  Palette,
  Sliders,
  Type,
  Link,
  Layers,
  Shield,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  GitBranch,
  Check,
  Zap,
} from 'lucide-react';

interface Props {
  config: HeroSectionConfig;
  deploymentSettings: DeploymentSettings;
  sessionToken?: string;
  onSaveHeroConfig: (config: HeroSectionConfig, isPublishAction?: boolean) => void;
  onRecordCommit?: (msg: string) => void;
}

const ACCENT_COLOR_PRESETS = [
  { name: 'Astro Blue & Cyan', primary: '#2563eb', secondary: '#06b6d4' },
  { name: 'Violet & Fuchsia', primary: '#7c3aed', secondary: '#ec4899' },
  { name: 'Emerald & Teal', primary: '#059669', secondary: '#14b8a6' },
  { name: 'Amber & Orange', primary: '#d97706', secondary: '#ea580c' },
  { name: 'Rose & Crimson', primary: '#e11d48', secondary: '#f43f5e' },
  { name: 'Dark Indigo & Sky', primary: '#4f46e5', secondary: '#38bdf8' },
];

export const HeroSectionManager: React.FC<Props> = ({
  config,
  deploymentSettings,
  sessionToken,
  onSaveHeroConfig,
  onRecordCommit,
}) => {
  const [localConfig, setLocalConfig] = useState<HeroSectionConfig>(config);
  
  // Sync when parent config updates
  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'illustration' | 'badges'>('content');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [svgUploadStatus, setSvgUploadStatus] = useState<string | null>(null);

  const updateConfig = (updates: Partial<HeroSectionConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onSaveHeroConfig(localConfig, false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      // 1. Save locally with publish action
      onSaveHeroConfig(localConfig, true);

      // 2. Perform GitHub atomic publishing
      const result = await executePublishContent({
        type: 'hero',
        heroConfig: localConfig,
        settings: deploymentSettings,
        sessionToken,
      });

      if (result.success) {
        setPublishResult(result);
        if (onRecordCommit && result.commit) {
          onRecordCommit(result.commit.message);
        }
      } else {
        setPublishError(result.error || 'Failed to push hero config to GitHub');
      }
    } catch (err: any) {
      setPublishError(err.message || 'An unexpected error occurred during publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset hero section to default factory configuration?')) {
      setLocalConfig(initialHeroConfig);
      onSaveHeroConfig(initialHeroConfig, false);
    }
  };

  const handleCustomSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.svg') && !file.type.includes('svg')) {
      alert('Please upload a valid .svg file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawSvg = reader.result as string;
      const sanitized = sanitizeSvgContent(rawSvg);
      updateConfig({
        illustrationType: 'custom-svg',
        customSvgContent: sanitized,
      });
      setSvgUploadStatus(`Custom SVG "${file.name}" sanitized and applied successfully.`);
      setTimeout(() => setSvgUploadStatus(null), 3500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddTrustBadge = () => {
    const newBadge: HeroTrustBadge = {
      id: 'tb-' + Date.now(),
      label: 'New Trust Metric',
      iconName: 'check',
      badgeType: 'text',
    };
    updateConfig({
      trustBadges: [...(localConfig.trustBadges || []), newBadge],
    });
  };

  const handleUpdateTrustBadge = (id: string, updates: Partial<HeroTrustBadge>) => {
    const updated = (localConfig.trustBadges || []).map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    updateConfig({ trustBadges: updated });
  };

  const handleRemoveTrustBadge = (id: string) => {
    const filtered = (localConfig.trustBadges || []).filter((b) => b.id !== id);
    updateConfig({ trustBadges: filtered });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hero Section Customizer</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    localConfig.enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {localConfig.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Live visual editor for typography, SVG illustrations, CTA buttons, and background gradients.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Responsive Preview Device Selector */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Desktop View (1440px)"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                previewDevice === 'tablet'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isPublishing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Hero Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Hero Configuration</span>
              </>
            )}
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing to GitHub...</span>
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                <span>Publish to GitHub</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Status Alerts */}
      {publishResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Published Successfully to GitHub!</span>
          </div>
          <p className="text-emerald-700">{publishResult.message}</p>
          {publishResult.commit && (
            <div className="font-mono text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded-lg mt-2 flex items-center justify-between">
              <span>SHA: {publishResult.commit.id}</span>
              <span>Branch: {publishResult.commit.branch}</span>
            </div>
          )}
        </div>
      )}

      {publishError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {svgUploadStatus && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{svgUploadStatus}</span>
        </div>
      )}

      {/* Main Customizer Grid: 2-Columns (Inspector Controls Left, Live Preview Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'content'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Content</span>
            </button>

            <button
              onClick={() => setActiveTab('illustration')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'illustration'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>SVG Art</span>
            </button>

            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'style'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Style</span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'badges'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Proof</span>
            </button>
          </div>

          {/* Master Enable/Disable Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 block">Enable Hero Section</span>
              <span className="text-xs text-slate-500">Show or hide the hero section on the homepage</span>
            </div>
            <button
              onClick={() => updateConfig({ enabled: !localConfig.enabled })}
              className={`p-2 rounded-xl transition-colors ${
                localConfig.enabled
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {localConfig.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          {/* TAB 1: CONTENT CONTROLS */}
          {activeTab === 'content' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs text-xs animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-600" />
                <span>Headings & Editorial Copy</span>
              </h3>

              {/* Eyebrow Controls */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Eyebrow Badge</label>
                  <input
                    type="checkbox"
                    checked={localConfig.showEyebrow}
                    onChange={(e) => updateConfig({ showEyebrow: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </div>
                {localConfig.showEyebrow && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={localConfig.eyebrowText}
                        onChange={(e) => updateConfig({ eyebrowText: e.target.value })}
                        placeholder="e.g. ⚡ Next-Gen Astro 5 + Gutenberg CMS"
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Badge Icon</label>
                      <select
                        value={localConfig.eyebrowIcon}
                        onChange={(e) => updateConfig({ eyebrowIcon: e.target.value as any })}
                        className="w-full p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <option value="sparkles">Sparkles ✨</option>
                        <option value="zap">Lightning ⚡</option>
                        <option value="rocket">Rocket 🚀</option>
                        <option value="code">Code &lt;/&gt;</option>
                        <option value="star">Star ⭐</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Heading */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Main Heading</label>
                <textarea
                  rows={3}
                  value={localConfig.heading}
                  onChange={(e) => updateConfig({ heading: e.target.value })}
                  placeholder="Enter headline..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Highlight Words Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Highlighted Words</label>
                  <input
                    type="text"
                    value={localConfig.headingHighlight}
                    onChange={(e) => updateConfig({ headingHighlight: e.target.value })}
                    placeholder="Words in heading to highlight..."
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Highlight Effect</label>
                  <select
                    value={localConfig.headingHighlightType}
                    onChange={(e) => updateConfig({ headingHighlightType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium"
                  >
                    <option value="gradient">Gradient Fill</option>
                    <option value="solid">Accent Solid</option>
                    <option value="underline">Wavy Underline</option>
                    <option value="badge">Pill Badge</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Supporting Description</label>
                  <input
                    type="checkbox"
                    checked={localConfig.showDescription}
                    onChange={(e) => updateConfig({ showDescription: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </div>
                {localConfig.showDescription && (
                  <textarea
                    rows={3}
                    value={localConfig.description}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                    placeholder="Supporting value proposition..."
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  />
                )}
              </div>

              {/* Buttons Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-900 block">Call-to-Action Buttons</label>

                {/* Primary Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600">Primary CTA Button</span>
                    <input
                      type="checkbox"
                      checked={localConfig.showPrimaryButton}
                      onChange={(e) => updateConfig({ showPrimaryButton: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                  </div>
                  {localConfig.showPrimaryButton && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={localConfig.primaryButtonText}
                        onChange={(e) => updateConfig({ primaryButtonText: e.target.value })}
                        placeholder="Button text"
                        className="p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={localConfig.primaryButtonUrl}
                        onChange={(e) => updateConfig({ primaryButtonUrl: e.target.value })}
                        placeholder="URL (e.g. /posts)"
                        className="p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Secondary Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Secondary Action Button</span>
                    <input
                      type="checkbox"
                      checked={localConfig.showSecondaryButton}
                      onChange={(e) => updateConfig({ showSecondaryButton: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                  </div>
                  {localConfig.showSecondaryButton && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={localConfig.secondaryButtonText}
                        onChange={(e) => updateConfig({ secondaryButtonText: e.target.value })}
                        placeholder="Button text"
                        className="p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={localConfig.secondaryButtonUrl}
                        onChange={(e) => updateConfig({ secondaryButtonUrl: e.target.value })}
                        placeholder="URL (e.g. /wpadmin)"
                        className="p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SVG ILLUSTRATION CONTROLS */}
          {activeTab === 'illustration' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs text-xs animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Custom SVG Illustration Controls</span>
              </h3>

              {/* Toggle Illustration */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Show SVG Illustration</span>
                <input
                  type="checkbox"
                  checked={localConfig.showIllustration}
                  onChange={(e) => updateConfig({ showIllustration: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>

              {localConfig.showIllustration && (
                <div className="space-y-4">
                  {/* Illustration Type Selector */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Illustration Source</label>
                    <select
                      value={localConfig.illustrationType}
                      onChange={(e) => updateConfig({ illustrationType: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-xs"
                    >
                      <option value="default-svg">AstroPress Tech SVG (Built-in Standalone)</option>
                      <option value="custom-svg">Upload Custom SVG File</option>
                    </select>
                  </div>

                  {/* Preset Color Themes */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">SVG Accent Color Palettes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ACCENT_COLOR_PRESETS.map((preset, idx) => {
                        const isSelected =
                          localConfig.svgAccentColor === preset.primary &&
                          localConfig.svgSecondaryColor === preset.secondary;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              updateConfig({
                                svgAccentColor: preset.primary,
                                svgSecondaryColor: preset.secondary,
                              })
                            }
                            className={`p-2 rounded-xl border cursor-pointer transition-all text-center space-y-1 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                                : 'border-slate-200 hover:border-slate-400 bg-white'
                            }`}
                          >
                            <div className="flex justify-center items-center gap-1">
                              <span
                                className="h-3.5 w-3.5 rounded-full shadow-2xs"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full shadow-2xs"
                                style={{ backgroundColor: preset.secondary }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 block truncate">
                              {preset.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Upload Slot */}
                  {localConfig.illustrationType === 'custom-svg' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                      <span className="font-bold text-slate-700 block">Upload Standalone SVG</span>
                      <p className="text-[11px] text-slate-500">
                        SVGs are automatically sanitized to disallow scripts and unsafe handlers.
                      </p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                        <span>Choose SVG File</span>
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          onChange={handleCustomSvgUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Layout & Position */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Illustration Position</label>
                      <select
                        value={localConfig.illustrationPosition}
                        onChange={(e) => updateConfig({ illustrationPosition: e.target.value as any })}
                        className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <option value="right">Right Side (Standard)</option>
                        <option value="left">Left Side</option>
                        <option value="bottom">Centered Bottom</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Mobile Display</label>
                      <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localConfig.hideIllustrationOnMobile}
                          onChange={(e) => updateConfig({ hideIllustrationOnMobile: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-[11px] font-medium text-slate-700">Hide on Mobile</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STYLE & LAYOUT CONTROLS */}
          {activeTab === 'style' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs text-xs animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <span>Background, Padding & Typography</span>
              </h3>

              {/* Background Preset */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Background Mode</label>
                <select
                  value={localConfig.backgroundType}
                  onChange={(e) => updateConfig({ backgroundType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-xs"
                >
                  <option value="gradient-subtle">Subtle Sky/Slate Gradient (Default)</option>
                  <option value="gradient-mesh">Radial Mesh Glow</option>
                  <option value="grid-pattern">Tech Dot Grid Overlay</option>
                  <option value="dark-slate">Modern Dark Slate</option>
                  <option value="pure-white">Pure Off-White</option>
                  <option value="solid">Solid Color</option>
                </select>
              </div>

              {/* Alignment & Typography */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Heading Size</label>
                  <select
                    value={localConfig.headingSize}
                    onChange={(e) => updateConfig({ headingSize: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="sm">Compact (2xl)</option>
                    <option value="base">Medium (3xl)</option>
                    <option value="lg">Large (4xl)</option>
                    <option value="2xl">Extra Large (5xl)</option>
                    <option value="4xl">Display Hero (7xl)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Text Alignment</label>
                  <select
                    value={localConfig.alignment}
                    onChange={(e) => updateConfig({ alignment: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              </div>

              {/* Padding & Spacing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Vertical Padding</label>
                  <select
                    value={localConfig.paddingY}
                    onChange={(e) => updateConfig({ paddingY: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="compact">Compact (py-8)</option>
                    <option value="normal">Standard (py-12)</option>
                    <option value="spacious">Spacious (py-16)</option>
                    <option value="luxurious">Luxurious (py-24)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Border Radius</label>
                  <select
                    value={localConfig.borderRadius}
                    onChange={(e) => updateConfig({ borderRadius: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="none">Square (none)</option>
                    <option value="md">Rounded (xl)</option>
                    <option value="lg">Smooth (2xl)</option>
                    <option value="3xl">Organic Pill (3xl)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRUST BADGES & PROOF */}
          {activeTab === 'badges' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Trust & Proof Badges</span>
                </h3>
                <button
                  onClick={handleAddTrustBadge}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Badge</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Show Trust Section</span>
                <input
                  type="checkbox"
                  checked={localConfig.showTrustBadges}
                  onChange={(e) => updateConfig({ showTrustBadges: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>

              {localConfig.showTrustBadges && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Section Title</label>
                    <input
                      type="text"
                      value={localConfig.trustBadgesTitle || ''}
                      onChange={(e) => updateConfig({ trustBadgesTitle: e.target.value })}
                      placeholder="e.g. Trusted by modern engineering teams"
                      className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    {(localConfig.trustBadges || []).map((badge, idx) => (
                      <div
                        key={badge.id || idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2"
                      >
                        <select
                          value={badge.iconName || 'sparkles'}
                          onChange={(e) =>
                            handleUpdateTrustBadge(badge.id, { iconName: e.target.value as any })
                          }
                          className="p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                        >
                          <option value="zap">⚡ Zap</option>
                          <option value="git">🔀 Git</option>
                          <option value="sparkles">✨ Sparkles</option>
                          <option value="star">⭐ Star</option>
                          <option value="shield">🛡️ Shield</option>
                          <option value="cpu">💻 CPU</option>
                          <option value="check">✔️ Check</option>
                        </select>

                        <input
                          type="text"
                          value={badge.label}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { label: e.target.value })}
                          className="flex-1 p-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold"
                        />

                        <button
                          onClick={() => handleRemoveTrustBadge(badge.id)}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Preview Panel (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-200/60 rounded-3xl p-4 lg:p-6 border border-slate-200/80 flex flex-col items-center justify-start min-h-[520px]">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Live Interactive Preview ({previewDevice})
            </span>
            <span className="text-[11px] text-slate-400">Updates dynamically in real time</span>
          </div>

          <div
            className={`transition-all duration-300 w-full overflow-hidden bg-white shadow-xl rounded-2xl ${
              previewDevice === 'mobile'
                ? 'max-w-[380px]'
                : previewDevice === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            <div className="p-4 sm:p-6 bg-slate-100/40 border-b border-slate-200">
              <HeroSection config={localConfig} isCustomizerPreview={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
