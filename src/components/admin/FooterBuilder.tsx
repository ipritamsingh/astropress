import React, { useState, useMemo, useEffect } from 'react';
import {
  ThemeSettings,
  SiteSettings,
  Menu,
  Category,
  FooterConfig,
  FooterSocialLink,
  FooterLegalLink,
  FooterNewsletterStyle,
} from '../../types/cms';
import { initialNewsletterStyle } from '../../data/initialData';
import { FooterNewsletterCard } from '../common/FooterNewsletterCard';
import {
  SUPPORTED_SOCIAL_PLATFORMS,
  SocialPlatformMeta,
  buildPlatformUrl,
  extractHandleFromUrl,
  getSocialPlatformIcon,
} from '../common/SocialIcons';
import {
  Layout,
  Save,
  CheckCircle2,
  Eye,
  Columns,
  Share2,
  FileText,
  Monitor,
  Tablet,
  Smartphone,
  Shield,
  ArrowUp,
  Plus,
  Trash2,
  Palette,
  Layers,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Search,
  Check,
  Link2,
  ExternalLink,
  AtSign,
  Mail,
  RotateCcw,
  Sliders,
  Type,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  menus: Menu[];
  categories: Category[];
  onSaveTheme: (newSettings: Partial<ThemeSettings>) => void;
  onSaveSiteSettings?: (newSiteSettings: Partial<SiteSettings>) => void;
}

const DEFAULT_LEGAL_LINKS: FooterLegalLink[] = [
  { id: 'leg-1', label: 'Privacy Policy', url: '/privacy-policy', enabled: true },
  { id: 'leg-2', label: 'Terms of Service', url: '/terms', enabled: true },
  { id: 'leg-3', label: 'Contact Us', url: '/contact', enabled: true },
];

const DEFAULT_INITIAL_SOCIAL_LINKS: FooterSocialLink[] = [
  {
    id: 'soc-gh',
    platform: 'github',
    label: 'GitHub',
    username: 'ipritamsingh',
    url: 'https://github.com/ipritamsingh',
    enabled: true,
    order: 1,
  },
  {
    id: 'soc-tw',
    platform: 'twitter',
    label: 'X / Twitter',
    username: '@astropress',
    url: 'https://x.com/astropress',
    enabled: true,
    order: 2,
  },
  {
    id: 'soc-yt',
    platform: 'youtube',
    label: 'YouTube',
    username: '@astropress',
    url: 'https://youtube.com/@astropress',
    enabled: true,
    order: 3,
  },
  {
    id: 'soc-tg',
    platform: 'telegram',
    label: 'Telegram',
    username: 'astropress',
    url: 'https://t.me/astropress',
    enabled: true,
    order: 4,
  },
  {
    id: 'soc-gb',
    platform: 'custom',
    label: 'Cloudflare',
    username: 'https://cloudflare.com',
    url: 'https://cloudflare.com',
    enabled: true,
    useCustomUrl: true,
    order: 5,
  },
];

const ColorPickerInput: React.FC<{
  label: string;
  value?: string;
  defaultValue: string;
  onChange: (color: string) => void;
  description?: string;
}> = ({ label, value, defaultValue, onChange, description }) => {
  const currentColor = value || defaultValue;
  const safeHex = currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#2563eb';
  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{currentColor}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeHex}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-11 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-slate-50 shrink-0"
        />
        <input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono uppercase text-slate-800 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      </div>
      {description && <p className="text-[10px] text-slate-400">{description}</p>}
    </div>
  );
};

export const FooterBuilder: React.FC<Props> = ({
  themeSettings,
  siteSettings,
  menus,
  categories,
  onSaveTheme,
  onSaveSiteSettings,
}) => {
  // Normalize social links safely for full backward compatibility
  const normalizedInitialSocialLinks = useMemo<FooterSocialLink[]>(() => {
    const rawLinks = themeSettings.footer?.socialLinks;
    if (!rawLinks || !Array.isArray(rawLinks)) {
      return DEFAULT_INITIAL_SOCIAL_LINKS;
    }
    return rawLinks.map((item, idx) => {
      const platformKey = (item.platform || 'custom').toLowerCase();
      const meta = SUPPORTED_SOCIAL_PLATFORMS.find((p) => p.id === platformKey);
      const username = item.username || extractHandleFromUrl(platformKey, item.url);
      const url = item.url || buildPlatformUrl(platformKey, username);
      return {
        id: item.id || `soc-${platformKey}-${idx}`,
        platform: platformKey,
        label: item.label || meta?.name || platformKey,
        username: username,
        url: url,
        enabled: item.enabled !== false,
        order: item.order !== undefined ? item.order : idx + 1,
        useCustomUrl: item.useCustomUrl ?? (meta?.isCustomUrl || false),
      };
    });
  }, [themeSettings.footer?.socialLinks]);

  const initialFooter: FooterConfig = {
    columns: themeSettings.footer?.columns || 4,
    layout: themeSettings.footer?.layout || 'standard',
    style: themeSettings.footer?.style || 'dark',
    containerWidth: themeSettings.footer?.containerWidth || 'normal',
    paddingY: themeSettings.footer?.paddingY || 'normal',
    showBrandCol: themeSettings.footer?.showBrandCol !== false,
    brandTitle: themeSettings.footer?.brandTitle || themeSettings.siteName || 'AstroPress',
    brandDescription:
      themeSettings.footer?.brandDescription ||
      themeSettings.tagline ||
      'High-performance headless publishing platform combining the WordPress editorial feel with Astro static speed, Sveltia CMS, and Cloudflare Pages edge delivery.',
    showBrandLogo: themeSettings.footer?.showBrandLogo !== false,
    navTitle: themeSettings.footer?.navTitle || 'Quick Links',
    menuLocation: themeSettings.footer?.menuLocation || 'footer',
    maxNavLinks: themeSettings.footer?.maxNavLinks || 5,
    categoriesTitle: themeSettings.footer?.categoriesTitle || 'Editorial Topics',
    categoriesStyle: themeSettings.footer?.categoriesStyle || 'badges',
    maxCategories: themeSettings.footer?.maxCategories || 6,
    showTechStackBadges: themeSettings.footer?.showTechStackBadges !== false,
    techStackBadgesText:
      themeSettings.footer?.techStackBadgesText || '● 100% Git-Backed Markdown & YAML',
    showNewsletter: themeSettings.footer?.showNewsletter !== false,
    newsletterTitle:
      siteSettings?.newsletterSettings?.title ||
      themeSettings.footer?.newsletterTitle ||
      'THE HEADLESS DISPATCH',
    newsletterSubtitle:
      siteSettings?.newsletterSettings?.subtitle ||
      themeSettings.footer?.newsletterSubtitle ||
      'Get the latest articles, tutorials and updates directly in your inbox.',
    newsletterPlaceholder:
      siteSettings?.newsletterSettings?.placeholderText ||
      themeSettings.footer?.newsletterPlaceholder ||
      'Enter your email address',
    newsletterButtonText:
      siteSettings?.newsletterSettings?.buttonText ||
      themeSettings.footer?.newsletterButtonText ||
      'Subscribe',
    newsletterSuccessMsg:
      siteSettings?.newsletterSettings?.successMessage ||
      themeSettings.footer?.newsletterSuccessMsg ||
      'Thank you for subscribing to The Headless Dispatch!',
    newsletterDisclaimer:
      themeSettings.footer?.newsletterDisclaimer || 'No spam. Unsubscribe at any time.',
    newsletterStyle: {
      ...initialNewsletterStyle,
      ...(themeSettings.footer?.newsletterStyle || {}),
    },
    showSocialLinks: themeSettings.footer?.showSocialLinks !== false,
    socialLinks: normalizedInitialSocialLinks,
    copyright:
      themeSettings.footer?.copyright ||
      '© {year} {sitename}. Powered by Astro & Sveltia CMS on Cloudflare Pages.',
    customCredits:
      themeSettings.footer?.customCredits || 'Engineered with ❤️ for Astro & Sveltia',
    showBackToTop: themeSettings.footer?.showBackToTop !== false,
    showLegalLinks: themeSettings.footer?.showLegalLinks !== false,
    legalLinks: themeSettings.footer?.legalLinks || DEFAULT_LEGAL_LINKS,
    bottomBarAlignment: themeSettings.footer?.bottomBarAlignment || 'split',
  };

  const [footerConfig, setFooterConfig] = useState<FooterConfig>(initialFooter);
  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'social' | 'subfooter' | 'newsletter'>('layout');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleResetNewsletterDefaults = () => {
    setFooterConfig((prev) => ({
      ...prev,
      newsletterTitle: 'THE HEADLESS DISPATCH',
      newsletterSubtitle: 'Get the latest articles, tutorials and updates directly in your inbox.',
      newsletterPlaceholder: 'Enter your email address',
      newsletterButtonText: 'Subscribe',
      newsletterDisclaimer: 'No spam. Unsubscribe at any time.',
      newsletterSuccessMsg: 'Thank you for subscribing to The Headless Dispatch!',
      newsletterStyle: { ...initialNewsletterStyle },
    }));
  };

  const updateNewsletterStyle = (patch: Partial<FooterNewsletterStyle>) => {
    setFooterConfig((prev) => ({
      ...prev,
      newsletterStyle: {
        ...initialNewsletterStyle,
        ...(prev.newsletterStyle || {}),
        ...patch,
      },
    }));
  };

  // Synchronize when themeSettings prop updates
  useEffect(() => {
    if (themeSettings.footer) {
      const rawLinks = themeSettings.footer.socialLinks;
      const normalizedSocialLinks: FooterSocialLink[] =
        Array.isArray(rawLinks)
          ? rawLinks.map((item, idx) => {
              const platformKey = (item.platform || 'custom').toLowerCase();
              const meta = SUPPORTED_SOCIAL_PLATFORMS.find((p) => p.id === platformKey);
              const username = item.username || extractHandleFromUrl(platformKey, item.url);
              const url = item.url || buildPlatformUrl(platformKey, username);
              return {
                id: item.id || `soc-${platformKey}-${idx}`,
                platform: platformKey,
                label: item.label || meta?.name || platformKey,
                username: username,
                url: url,
                enabled: item.enabled !== false,
                order: item.order !== undefined ? item.order : idx + 1,
                useCustomUrl: item.useCustomUrl ?? (meta?.isCustomUrl || false),
              };
            })
          : DEFAULT_INITIAL_SOCIAL_LINKS;

      setFooterConfig((prev) => ({
        ...prev,
        ...themeSettings.footer,
        newsletterStyle: {
          ...initialNewsletterStyle,
          ...(prev.newsletterStyle || {}),
          ...(themeSettings.footer?.newsletterStyle || {}),
        },
        socialLinks: normalizedSocialLinks,
        legalLinks: themeSettings.footer.legalLinks || prev.legalLinks || DEFAULT_LEGAL_LINKS,
      }));
    }
  }, [themeSettings.footer]);

  // Social Channels selector state
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [platformSearchQuery, setPlatformSearchQuery] = useState('');
  const [platformCategoryFilter, setPlatformCategoryFilter] = useState<'all' | 'social' | 'messaging' | 'content'>('all');

  const footerMenu =
    menus.find((m) => m.location === footerConfig.menuLocation) ||
    menus.find((m) => m.location === 'footer') ||
    menus[0];

  const handleSave = () => {
    onSaveTheme({
      footer: footerConfig,
    });

    if (onSaveSiteSettings && siteSettings?.newsletterSettings) {
      onSaveSiteSettings({
        newsletterSettings: {
          ...siteSettings.newsletterSettings,
          title: footerConfig.newsletterTitle,
          subtitle: footerConfig.newsletterSubtitle,
          placeholderText: footerConfig.newsletterPlaceholder || 'Enter your email...',
          buttonText: footerConfig.newsletterButtonText || 'Subscribe',
          successMessage: footerConfig.newsletterSuccessMsg || 'Thank you for subscribing!',
        },
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const applyPreset = (preset: 'classic' | 'modern' | 'editorial' | 'minimal') => {
    if (preset === 'classic') {
      setFooterConfig((prev) => ({
        ...prev,
        columns: 4,
        layout: 'standard',
        style: 'dark',
        paddingY: 'normal',
        showBrandCol: true,
        showNewsletter: true,
        categoriesStyle: 'badges',
        bottomBarAlignment: 'split',
      }));
    } else if (preset === 'modern') {
      setFooterConfig((prev) => ({
        ...prev,
        columns: 4,
        layout: 'split',
        style: 'midnight',
        paddingY: 'spacious',
        showBrandCol: true,
        showNewsletter: true,
        categoriesStyle: 'badges',
        bottomBarAlignment: 'split',
      }));
    } else if (preset === 'editorial') {
      setFooterConfig((prev) => ({
        ...prev,
        columns: 3,
        layout: 'standard',
        style: 'dark',
        paddingY: 'normal',
        showBrandCol: true,
        showNewsletter: false,
        categoriesStyle: 'list',
        bottomBarAlignment: 'split',
      }));
    } else if (preset === 'minimal') {
      setFooterConfig((prev) => ({
        ...prev,
        columns: 2,
        layout: 'minimal',
        style: 'subtle',
        paddingY: 'compact',
        showBrandCol: true,
        showNewsletter: false,
        bottomBarAlignment: 'center',
      }));
    }
  };

  /* ========================================================================= */
  /* DYNAMIC SOCIAL PLATFORMS MANAGEMENT                                       */
  /* ========================================================================= */

  const existingPlatformIds = useMemo(() => {
    return new Set((footerConfig.socialLinks || []).map((s) => s.platform.toLowerCase()));
  }, [footerConfig.socialLinks]);

  const filteredPlatforms = useMemo(() => {
    return SUPPORTED_SOCIAL_PLATFORMS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(platformSearchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(platformSearchQuery.toLowerCase());
      const matchesCategory =
        platformCategoryFilter === 'all' || p.category === platformCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [platformSearchQuery, platformCategoryFilter]);

  const updateFooterConfigAndPropagate = (nextConfig: FooterConfig) => {
    setFooterConfig(nextConfig);
    onSaveTheme({ footer: nextConfig });
  };

  const handleAddPlatform = (platformMeta: SocialPlatformMeta) => {
    const currentLinks = footerConfig.socialLinks || [];
    const isAlreadyAdded = currentLinks.some((l) => l.platform.toLowerCase() === platformMeta.id);
    if (isAlreadyAdded && platformMeta.id !== 'custom') {
      return;
    }

    const defaultUsername = platformMeta.id === 'custom' ? 'https://' : '@astropress';
    const initialUrl = platformMeta.urlTemplate(defaultUsername);

    const newLink: FooterSocialLink = {
      id: `soc-${platformMeta.id}-${Date.now()}`,
      platform: platformMeta.id,
      label: platformMeta.name,
      username: defaultUsername,
      url: initialUrl,
      enabled: true,
      order: currentLinks.length + 1,
      useCustomUrl: platformMeta.isCustomUrl || false,
    };

    updateFooterConfigAndPropagate({
      ...footerConfig,
      socialLinks: [...currentLinks, newLink],
    });
    setShowAddPlatformModal(false);
    setPlatformSearchQuery('');
  };

  const handleToggleSocial = (id: string) => {
    const list = footerConfig.socialLinks || [];
    const updated = list.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateFooterConfigAndPropagate({ ...footerConfig, socialLinks: updated });
  };

  const handleUpdateSocialHandle = (id: string, newHandle: string) => {
    const list = footerConfig.socialLinks || [];
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      const url = item.useCustomUrl
        ? item.url
        : buildPlatformUrl(item.platform, newHandle);
      return {
        ...item,
        username: newHandle,
        url: url,
      };
    });
    updateFooterConfigAndPropagate({ ...footerConfig, socialLinks: updated });
  };

  const handleUpdateSocialCustomUrl = (id: string, newUrl: string) => {
    const list = footerConfig.socialLinks || [];
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        url: newUrl,
      };
    });
    updateFooterConfigAndPropagate({ ...footerConfig, socialLinks: updated });
  };

  const handleToggleCustomUrlMode = (id: string) => {
    const list = footerConfig.socialLinks || [];
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      const willUseCustom = !item.useCustomUrl;
      const currentUrl = item.url || buildPlatformUrl(item.platform, item.username || '');
      return {
        ...item,
        useCustomUrl: willUseCustom,
        url: currentUrl,
      };
    });
    updateFooterConfigAndPropagate({ ...footerConfig, socialLinks: updated });
  };

  const handleDeleteSocial = (id: string) => {
    const list = footerConfig.socialLinks || [];
    updateFooterConfigAndPropagate({
      ...footerConfig,
      socialLinks: list.filter((item) => item.id !== id),
    });
  };

  const handleMoveSocial = (index: number, direction: 'up' | 'down') => {
    const list = [...(footerConfig.socialLinks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign sequential order
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateFooterConfigAndPropagate({ ...footerConfig, socialLinks: reordered });
  };

  /* ========================================================================= */
  /* LEGAL LINKS MANAGEMENT                                                    */
  /* ========================================================================= */

  const handleAddLegalLink = () => {
    const current = footerConfig.legalLinks || DEFAULT_LEGAL_LINKS;
    const newLink: FooterLegalLink = {
      id: `leg-${Date.now()}`,
      label: 'New Link',
      url: '/page',
      enabled: true,
    };
    setFooterConfig({ ...footerConfig, legalLinks: [...current, newLink] });
  };

  const handleUpdateLegalLink = (id: string, field: 'label' | 'url', value: string) => {
    const current = footerConfig.legalLinks || DEFAULT_LEGAL_LINKS;
    const updated = current.map((link) =>
      link.id === id ? { ...link, [field]: value } : link
    );
    setFooterConfig({ ...footerConfig, legalLinks: updated });
  };

  const handleDeleteLegalLink = (id: string) => {
    const current = footerConfig.legalLinks || DEFAULT_LEGAL_LINKS;
    setFooterConfig({
      ...footerConfig,
      legalLinks: current.filter((l) => l.id !== id),
    });
  };

  const currentYear = new Date().getFullYear().toString();
  const renderedCopyright = (footerConfig.copyright || '')
    .replace('{year}', currentYear)
    .replace('{sitename}', footerConfig.brandTitle || themeSettings.siteName || 'AstroPress');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Layout className="h-4 w-4" />
            <span>WordPress-Style Theme Builder</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Visual Footer Builder & Widget Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Design multi-column layouts, brand bio, topic pills, newsletter subscription, social badges, and legal sub-footer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Presets Dropdown */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-bold px-2">Presets:</span>
            <button
              onClick={() => applyPreset('classic')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold shadow-2xs transition-colors"
            >
              Classic 4-Col
            </button>
            <button
              onClick={() => applyPreset('modern')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold shadow-2xs transition-colors"
            >
              Modern Tech
            </button>
            <button
              onClick={() => applyPreset('minimal')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold shadow-2xs transition-colors"
            >
              Minimal 2-Col
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Footer Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Footer Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LIVE INTERACTIVE VISUAL PREVIEW BOX                                    */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>Live Interactive Preview</span>
          </span>

          {/* Device Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                previewDevice === 'tablet'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Outer Frame with device responsiveness */}
        <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex justify-center overflow-x-auto">
          <div
            className={`transition-all duration-300 w-full ${
              previewDevice === 'mobile'
                ? 'max-w-[390px]'
                : previewDevice === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            {/* The Rendered Footer Preview Container */}
            <div
              className={`rounded-2xl border transition-colors ${
                footerConfig.style === 'light'
                  ? 'bg-white border-slate-200 text-slate-700 shadow-md'
                  : footerConfig.style === 'subtle'
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : footerConfig.style === 'midnight'
                  ? 'bg-slate-950 border-slate-800/80 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              } ${
                footerConfig.paddingY === 'compact'
                  ? 'p-6 sm:p-8'
                  : footerConfig.paddingY === 'spacious'
                  ? 'p-10 sm:p-14'
                  : 'p-8 sm:p-10'
              }`}
            >
              {/* Columns Grid */}
              <div
                className={`grid gap-8 pb-8 border-b ${
                  footerConfig.style === 'light' ? 'border-slate-200' : 'border-slate-800/80'
                } ${
                  footerConfig.columns === 1
                    ? 'grid-cols-1 text-center'
                    : footerConfig.columns === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : footerConfig.columns === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {/* Column 1: Brand Info */}
                {footerConfig.showBrandCol && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      {footerConfig.showBrandLogo && (
                        <div
                          style={{ backgroundColor: themeSettings.primaryColor }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-xs"
                        >
                          A
                        </div>
                      )}
                      <span className="font-extrabold text-white text-base tracking-tight">
                        {footerConfig.brandTitle || themeSettings.siteName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {footerConfig.brandDescription || themeSettings.tagline}
                    </p>

                    {/* Dynamic Social Badges in Brand column */}
                    {footerConfig.showSocialLinks && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(footerConfig.socialLinks || [])
                          .filter((s) => s.enabled)
                          .map((soc) => (
                            <a
                              key={soc.id}
                              href={soc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                              title={`${soc.label} (${soc.username || soc.url})`}
                            >
                              {getSocialPlatformIcon(soc.platform, 'w-3.5 h-3.5')}
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Column 2: Navigation Links */}
                {footerConfig.columns >= 2 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {footerConfig.navTitle || 'Quick Links'}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-400">
                      {(footerMenu?.items || [
                        { id: '1', label: 'Home', url: '/' },
                        { id: '2', label: 'Articles', url: '/posts' },
                        { id: '3', label: 'About Us', url: '/about' },
                        { id: '4', label: 'Contact', url: '/contact' },
                      ])
                        .slice(0, footerConfig.maxNavLinks || 5)
                        .map((item) => (
                          <li key={item.id} className="hover:text-white cursor-pointer transition-colors">
                            {item.label}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Column 3: Topics / Categories */}
                {footerConfig.columns >= 3 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {footerConfig.categoriesTitle || 'Editorial Topics'}
                    </h4>
                    {footerConfig.categoriesStyle === 'list' ? (
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {categories.slice(0, footerConfig.maxCategories || 6).map((cat) => (
                          <li key={cat.id} className="hover:text-white cursor-pointer">
                            • {cat.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.slice(0, footerConfig.maxCategories || 6).map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {footerConfig.showTechStackBadges && (
                      <div className="pt-2 text-[11px] text-emerald-400 font-medium">
                        {footerConfig.techStackBadgesText}
                      </div>
                    )}
                  </div>
                )}

                {/* Column 4: Newsletter Box */}
                {footerConfig.columns >= 4 && footerConfig.showNewsletter && (
                  <div className="w-full">
                    <FooterNewsletterCard
                      footerConfig={footerConfig}
                      siteSettings={siteSettings}
                      isPreview={true}
                    />
                  </div>
                )}
              </div>

              {/* Sub-Footer Bottom Bar */}
              <div
                className={`pt-6 flex flex-col sm:flex-row items-center text-xs text-slate-400 gap-3 ${
                  footerConfig.bottomBarAlignment === 'center'
                    ? 'justify-center text-center'
                    : 'justify-between'
                }`}
              >
                <div>
                  <p>{renderedCopyright}</p>
                  {footerConfig.showLegalLinks && (footerConfig.legalLinks || []).length > 0 && (
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                      {(footerConfig.legalLinks || []).map((leg) => (
                        <span key={leg.id} className="hover:text-slate-300 cursor-pointer">
                          {leg.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span>{footerConfig.customCredits}</span>
                  {footerConfig.showBackToTop && (
                    <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS & CONTROLS TABS                                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'layout'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Columns className="h-4 w-4" />
            <span>1. Columns & Layout</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Column Widgets & Content</span>
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'social'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>3. Social Channels ({(footerConfig.socialLinks || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subfooter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'subfooter'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>4. Sub-Footer & Legal</span>
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'newsletter'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>5. Newsletter Card Styling</span>
          </button>
        </div>

        {/* Tab 1: Layout & Columns */}
        {activeTab === 'layout' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column Count Selection */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Columns className="h-4 w-4 text-blue-600" />
                  <span>Footer Columns Grid ({footerConfig.columns} Columns)</span>
                </h3>

                <div className="grid grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setFooterConfig({ ...footerConfig, columns: cols })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        footerConfig.columns === cols
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold ring-2 ring-blue-600/20 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="text-base font-extrabold">{cols}</div>
                      <div className="text-[10px] uppercase text-slate-400">
                        {cols === 1 ? 'Column' : 'Cols'}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {footerConfig.columns === 4
                    ? '4 Columns: Site Brand + Navigation Links + Topic Badges + Newsletter Capture.'
                    : footerConfig.columns === 3
                    ? '3 Columns: Site Brand + Navigation Links + Topic Badges.'
                    : footerConfig.columns === 2
                    ? '2 Columns: Site Brand + Navigation / Quick Links.'
                    : '1 Column: Centered Minimalist Brand Identity.'}
                </p>
              </div>

              {/* Theme & Style */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-600" />
                  <span>Color Theme & Styling</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', name: 'Dark Slate', desc: 'Classic AstroPress Slate-950' },
                    { id: 'midnight', name: 'Midnight Navy', desc: 'Rich Navy Blue Tint' },
                    { id: 'light', name: 'Clean Light', desc: 'Pure White Background' },
                    { id: 'subtle', name: 'Subtle Slate', desc: 'Medium Slate-900' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFooterConfig({ ...footerConfig, style: theme.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        footerConfig.style === theme.id
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-xs block">{theme.name}</span>
                      <span className="text-[10px] text-slate-400">{theme.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Vertical Padding
                    </label>
                    <select
                      value={footerConfig.paddingY || 'normal'}
                      onChange={(e) =>
                        setFooterConfig({ ...footerConfig, paddingY: e.target.value as any })
                      }
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="compact">Compact (py-8)</option>
                      <option value="normal">Normal (py-16)</option>
                      <option value="spacious">Spacious (py-20)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Container Width
                    </label>
                    <select
                      value={footerConfig.containerWidth || 'normal'}
                      onChange={(e) =>
                        setFooterConfig({ ...footerConfig, containerWidth: e.target.value as any })
                      }
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="normal">Standard (max-w-7xl)</option>
                      <option value="wide">Wide (max-w-screen-2xl)</option>
                      <option value="narrow">Compact (max-w-5xl)</option>
                      <option value="full">Full Width</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Content & Column Widgets */}
        {activeTab === 'content' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Site Brand Settings */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Column 1: Site Identity & Bio
                  </h3>
                  <input
                    type="checkbox"
                    checked={footerConfig.showBrandCol}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showBrandCol: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Footer Brand Title
                  </label>
                  <input
                    type="text"
                    value={footerConfig.brandTitle || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, brandTitle: e.target.value })
                    }
                    placeholder="Site Title"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Footer Bio / About Description
                  </label>
                  <textarea
                    rows={3}
                    value={footerConfig.brandDescription || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, brandDescription: e.target.value })
                    }
                    placeholder="Short summary of the site..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600">Show Brand Logo Icon</span>
                  <input
                    type="checkbox"
                    checked={footerConfig.showBrandLogo}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showBrandLogo: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* Column 2: Navigation Settings */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Column 2: Navigation Links
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Column Heading
                  </label>
                  <input
                    type="text"
                    value={footerConfig.navTitle || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, navTitle: e.target.value })
                    }
                    placeholder="Quick Links"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Source Menu
                  </label>
                  <select
                    value={footerConfig.menuLocation || 'footer'}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, menuLocation: e.target.value })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {menus.map((m) => (
                      <option key={m.id} value={m.location}>
                        {m.name} ({m.location}) — {m.items.length} links
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Max Links to Display ({footerConfig.maxNavLinks || 5})
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={footerConfig.maxNavLinks || 5}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, maxNavLinks: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Column 3: Topics / Taxonomy Settings */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Column 3: Editorial Topics & Badges
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Column Heading
                  </label>
                  <input
                    type="text"
                    value={footerConfig.categoriesTitle || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, categoriesTitle: e.target.value })
                    }
                    placeholder="Editorial Topics"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Display Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFooterConfig({ ...footerConfig, categoriesStyle: 'badges' })
                      }
                      className={`p-2 rounded-lg text-xs font-semibold border ${
                        footerConfig.categoriesStyle === 'badges'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Pill Badges
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFooterConfig({ ...footerConfig, categoriesStyle: 'list' })
                      }
                      className={`p-2 rounded-lg text-xs font-semibold border ${
                        footerConfig.categoriesStyle === 'list'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Vertical List
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600">Show Tech Stack Tag</span>
                  <input
                    type="checkbox"
                    checked={footerConfig.showTechStackBadges}
                    onChange={(e) =>
                      setFooterConfig({
                        ...footerConfig,
                        showTechStackBadges: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                {footerConfig.showTechStackBadges && (
                  <input
                    type="text"
                    value={footerConfig.techStackBadgesText || ''}
                    onChange={(e) =>
                      setFooterConfig({
                        ...footerConfig,
                        techStackBadgesText: e.target.value,
                      })
                    }
                    placeholder="● 100% Git-Backed Markdown & YAML"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-emerald-600 font-medium"
                  />
                )}
              </div>

              {/* Column 4: Newsletter Box Settings */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Column 4: Newsletter Lead Capture
                  </h3>
                  <input
                    type="checkbox"
                    checked={footerConfig.showNewsletter}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showNewsletter: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Newsletter Title
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterTitle}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterTitle: e.target.value })
                    }
                    placeholder="Newsletter Headline"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={footerConfig.newsletterSubtitle}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterSubtitle: e.target.value })
                    }
                    placeholder="Short value proposition..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={footerConfig.newsletterButtonText || ''}
                      onChange={(e) =>
                        setFooterConfig({
                          ...footerConfig,
                          newsletterButtonText: e.target.value,
                        })
                      }
                      placeholder="Subscribe"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={footerConfig.newsletterPlaceholder || ''}
                      onChange={(e) =>
                        setFooterConfig({
                          ...footerConfig,
                          newsletterPlaceholder: e.target.value,
                        })
                      }
                      placeholder="Enter email..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Privacy / Spam Disclaimer
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterDisclaimer || ''}
                    onChange={(e) =>
                      setFooterConfig({
                        ...footerConfig,
                        newsletterDisclaimer: e.target.value,
                      })
                    }
                    placeholder="No spam. Unsubscribe at any time."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('newsletter')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>Open Newsletter Card Styling (Colors, Fonts, Layout)</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Social Channels (DYNAMIC ADD PLATFORM SYSTEM) */}
        {activeTab === 'social' && (
          <div className="p-6 space-y-6">
            {/* Header & Global Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span>Configured Social Channels</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add social network channels by handle/username. URLs are automatically generated.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Display in Footer</span>
                  <input
                    type="checkbox"
                    checked={footerConfig.showSocialLinks}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showSocialLinks: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlatformModal(true);
                    setPlatformSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Social Platform</span>
                </button>
              </div>
            </div>

            {/* Configured Social Rows List */}
            {(footerConfig.socialLinks || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">No Social Platforms Configured</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Add Social Platform" above to add Instagram, YouTube, X, Telegram, TikTok, Discord, and more!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPlatformModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Platform</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(footerConfig.socialLinks || []).map((soc, index) => {
                  const meta = SUPPORTED_SOCIAL_PLATFORMS.find((p) => p.id === soc.platform.toLowerCase());
                  const handlePrefix = meta?.handlePrefix || '@';
                  const placeholder = meta?.placeholder || '@username';

                  return (
                    <div
                      key={soc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        soc.enabled
                          ? 'border-slate-200 bg-white shadow-2xs hover:border-blue-300'
                          : 'border-slate-200 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Side: Drag/Reorder + Official Icon + Platform Name */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveSocial(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                              title="Move Up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSocial(index, 'down')}
                              disabled={index === (footerConfig.socialLinks || []).length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                              title="Move Down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Official Local Brand Icon */}
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-2xs shrink-0">
                            {getSocialPlatformIcon(soc.platform, 'w-5 h-5')}
                          </div>

                          {/* Platform Name & Category */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">{soc.label || meta?.name || soc.platform}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                {meta?.category || 'social'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]" title={soc.url}>
                              {soc.url || 'No URL generated'}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Input for Handle or Custom URL */}
                        <div className="flex-1 max-w-xl">
                          {soc.useCustomUrl ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-slate-600">Full Custom URL</label>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCustomUrlMode(soc.id)}
                                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                                >
                                  Switch to Username / Handle
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600">
                                <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <input
                                  type="url"
                                  value={soc.url}
                                  onChange={(e) => handleUpdateSocialCustomUrl(soc.id, e.target.value)}
                                  placeholder="https://..."
                                  className="w-full text-xs bg-transparent border-0 outline-none text-slate-800 font-mono"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-slate-600">Username / Handle</label>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCustomUrlMode(soc.id)}
                                  className="text-[10px] text-slate-500 hover:text-blue-600 hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Link2 className="h-3 w-3" />
                                  <span>Use Custom URL</span>
                                </button>
                              </div>
                              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600">
                                <span className="text-[11px] font-mono text-slate-500 bg-slate-100/90 px-2.5 py-1.5 border-r border-slate-200 shrink-0">
                                  {handlePrefix}
                                </span>
                                <input
                                  type="text"
                                  value={soc.username || ''}
                                  onChange={(e) => handleUpdateSocialHandle(soc.id, e.target.value)}
                                  placeholder={placeholder}
                                  className="w-full text-xs px-2.5 py-1.5 bg-transparent border-0 outline-none text-slate-800 font-medium"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Side: Enable Toggle + Target Link + Delete */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          {soc.url && (
                            <a
                              href={soc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Test Link (Opens in new tab)"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <span className="text-xs font-semibold text-slate-600">
                              {soc.enabled ? (
                                <span className="text-emerald-600 font-bold">Enabled</span>
                              ) : (
                                <span className="text-slate-400">Disabled</span>
                              )}
                            </span>
                            <input
                              type="checkbox"
                              checked={soc.enabled}
                              onChange={() => handleToggleSocial(soc.id)}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteSocial(soc.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove Platform"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sub-Footer & Legal Bar */}
        {activeTab === 'subfooter' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Copyright & Editorial Credits */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Copyright & Credits</span>
                </h3>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Copyright Line</label>
                    <span className="text-[10px] text-slate-400 font-mono">Use {'{year}'}, {'{sitename}'}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={footerConfig.copyright}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, copyright: e.target.value })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Custom Editorial Credits
                  </label>
                  <input
                    type="text"
                    value={footerConfig.customCredits || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, customCredits: e.target.value })
                    }
                    placeholder="e.g. Engineered with ❤️ for Astro & Sveltia"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Back-to-Top Button</span>
                    <span className="text-[10px] text-slate-500">
                      Smooth scrolling button on the bottom right
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={footerConfig.showBackToTop}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showBackToTop: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* Legal Links Manager */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span>Legal & Policy Links</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLegalLink}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(footerConfig.legalLinks || DEFAULT_LEGAL_LINKS).map((leg) => (
                    <div key={leg.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={leg.label}
                        onChange={(e) => handleUpdateLegalLink(leg.id, 'label', e.target.value)}
                        placeholder="Label"
                        className="w-1/3 text-xs p-1.5 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={leg.url}
                        onChange={(e) => handleUpdateLegalLink(leg.id, 'url', e.target.value)}
                        placeholder="/privacy-policy"
                        className="flex-1 text-xs p-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLegalLink(leg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bottom Bar Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'split', name: 'Split (Left/Right)' },
                      { id: 'center', name: 'Centered' },
                      { id: 'stacked', name: 'Stacked' },
                    ].map((align) => (
                      <button
                        key={align.id}
                        type="button"
                        onClick={() =>
                          setFooterConfig({
                            ...footerConfig,
                            bottomBarAlignment: align.id as any,
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                          footerConfig.bottomBarAlignment === align.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {align.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Newsletter Card Design & Customization */}
        {activeTab === 'newsletter' && (
          <div className="p-6 space-y-8">
            {/* Top Toolbar with Reset Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Newsletter Card Styling & Appearance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the modern blue gradient card, typography, buttons, colors, and layout for the footer email subscription section.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetNewsletterDefaults}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  title="Restore default newsletter colors, text, and layout without affecting other site settings"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Reset Newsletter Defaults</span>
                </button>
              </div>
            </div>

            {/* Section 1: Content & Copy */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>1. Content & Messaging</span>
                </h4>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={footerConfig.showNewsletter}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, showNewsletter: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Enable Newsletter Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Heading Title
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterTitle}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterTitle: e.target.value })
                    }
                    placeholder="THE HEADLESS DISPATCH"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Description Text
                  </label>
                  <textarea
                    rows={2}
                    value={footerConfig.newsletterSubtitle}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterSubtitle: e.target.value })
                    }
                    placeholder="Get the latest articles, tutorials and updates directly in your inbox."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Input Placeholder
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterPlaceholder || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterPlaceholder: e.target.value })
                    }
                    placeholder="Enter your email address"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Subscribe Button Label
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterButtonText || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterButtonText: e.target.value })
                    }
                    placeholder="Subscribe"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Privacy / Disclaimer Text
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterDisclaimer || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterDisclaimer: e.target.value })
                    }
                    placeholder="No spam. Unsubscribe at any time."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Success Message
                  </label>
                  <input
                    type="text"
                    value={footerConfig.newsletterSuccessMsg || ''}
                    onChange={(e) =>
                      setFooterConfig({ ...footerConfig, newsletterSuccessMsg: e.target.value })
                    }
                    placeholder="Thank you for subscribing!"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={footerConfig.newsletterStyle?.showIcon !== false}
                      onChange={(e) =>
                        updateNewsletterStyle({ showIcon: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>Show Mail Icon in Header</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Icon Size:</span>
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateNewsletterStyle({ iconSize: size })}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                          (footerConfig.newsletterStyle?.iconSize || 'md') === size
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Colors & Visual Palette */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <span>2. Color Palette & Gradients</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <ColorPickerInput
                  label="Card Background (Start)"
                  value={footerConfig.newsletterStyle?.cardBgStart}
                  defaultValue="#1E3A8A"
                  description="Top-left gradient start color"
                  onChange={(c) => updateNewsletterStyle({ cardBgStart: c })}
                />
                <ColorPickerInput
                  label="Card Background (End)"
                  value={footerConfig.newsletterStyle?.cardBgEnd}
                  defaultValue="#0B1220"
                  description="Bottom-right gradient end color"
                  onChange={(c) => updateNewsletterStyle({ cardBgEnd: c })}
                />
                <ColorPickerInput
                  label="Button Background"
                  value={footerConfig.newsletterStyle?.buttonBg}
                  defaultValue="#2563EB"
                  description="Subscribe CTA button background"
                  onChange={(c) => updateNewsletterStyle({ buttonBg: c })}
                />
                <ColorPickerInput
                  label="Button Text Color"
                  value={footerConfig.newsletterStyle?.buttonTextColor}
                  defaultValue="#FFFFFF"
                  description="Subscribe CTA label and icon"
                  onChange={(c) => updateNewsletterStyle({ buttonTextColor: c })}
                />
                <ColorPickerInput
                  label="Input Background"
                  value={footerConfig.newsletterStyle?.inputBg}
                  defaultValue="#111827"
                  description="Dark navy email input background"
                  onChange={(c) => updateNewsletterStyle({ inputBg: c })}
                />
                <ColorPickerInput
                  label="Input Border Color"
                  value={footerConfig.newsletterStyle?.inputBorder}
                  defaultValue="#1F2937"
                  description="Subtle input border outline"
                  onChange={(c) => updateNewsletterStyle({ inputBorder: c })}
                />
                <ColorPickerInput
                  label="Input Text Color"
                  value={footerConfig.newsletterStyle?.inputTextColor}
                  defaultValue="#F9FAFB"
                  description="Typed email address text"
                  onChange={(c) => updateNewsletterStyle({ inputTextColor: c })}
                />
                <ColorPickerInput
                  label="Input Placeholder Color"
                  value={footerConfig.newsletterStyle?.placeholderColor}
                  defaultValue="#94A3B8"
                  description="Placeholder text preview"
                  onChange={(c) => updateNewsletterStyle({ placeholderColor: c })}
                />
                <ColorPickerInput
                  label="Heading Text Color"
                  value={footerConfig.newsletterStyle?.headingColor}
                  defaultValue="#F9FAFB"
                  description="Card title color"
                  onChange={(c) => updateNewsletterStyle({ headingColor: c })}
                />
                <ColorPickerInput
                  label="Description Text Color"
                  value={footerConfig.newsletterStyle?.descriptionColor}
                  defaultValue="#94A3B8"
                  description="Subtitle proposition color"
                  onChange={(c) => updateNewsletterStyle({ descriptionColor: c })}
                />
                <ColorPickerInput
                  label="Privacy Disclaimer Color"
                  value={footerConfig.newsletterStyle?.privacyTextColor}
                  defaultValue="#94A3B8"
                  description="No spam disclaimer text color"
                  onChange={(c) => updateNewsletterStyle({ privacyTextColor: c })}
                />
              </div>
            </div>

            {/* Section 3: Layout & Sizing */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>3. Layout, Padding & Dimensions</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                {/* Card Padding */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Card Padding</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', name: 'Compact' },
                      { id: 'normal', name: 'Normal' },
                      { id: 'spacious', name: 'Spacious' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ cardPadding: p.id as any })}
                        className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.cardPadding || 'normal') === p.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Border Radius</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'sm', name: 'SM' },
                      { id: 'md', name: 'MD' },
                      { id: 'lg', name: 'LG' },
                      { id: 'xl', name: 'XL' },
                      { id: '2xl', name: '2XL' },
                      { id: '3xl', name: '3XL' },
                      { id: 'none', name: 'None' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ cardBorderRadius: r.id as any })}
                        className={`py-1 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.cardBorderRadius || '2xl') === r.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Height */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Input Height</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', name: 'Compact (36px)' },
                      { id: 'normal', name: 'Normal (38px)' },
                      { id: 'comfortable', name: 'Comfort (42px)' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ inputHeight: h.id as any })}
                        className={`py-1.5 px-1 text-[11px] rounded-lg font-semibold border text-center transition-all ${
                          (footerConfig.newsletterStyle?.inputHeight || 'compact') === h.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Height */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Button Height</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', name: 'Compact' },
                      { id: 'normal', name: 'Normal' },
                      { id: 'comfortable', name: 'Comfort' },
                    ].map((bh) => (
                      <button
                        key={bh.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ buttonHeight: bh.id as any })}
                        className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.buttonHeight || 'compact') === bh.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bh.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Horizontal Padding */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Button Padding (X)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', name: 'Compact' },
                      { id: 'normal', name: 'Normal' },
                      { id: 'spacious', name: 'Spacious' },
                    ].map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ buttonPaddingX: bp.id as any })}
                        className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.buttonPaddingX || 'normal') === bp.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap Between Input and Button */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Input/Button Gap</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'xs', name: '6px' },
                      { id: 'sm', name: '8px' },
                      { id: 'md', name: '12px' },
                      { id: 'lg', name: '16px' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ gap: g.id as any })}
                        className={`py-1.5 px-1 text-xs rounded-lg font-semibold border text-center transition-all ${
                          (footerConfig.newsletterStyle?.gap || 'sm') === g.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop Layout Direction */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Desktop Alignment</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'row', name: 'Side by Side' },
                      { id: 'column', name: 'Stacked Vertical' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ desktopLayout: l.id as any })}
                        className={`py-1.5 px-2 text-xs rounded-lg font-semibold border text-center transition-all ${
                          (footerConfig.newsletterStyle?.desktopLayout || 'row') === l.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maximum Content Width */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Max Width</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'sm', name: 'SM' },
                      { id: 'md', name: 'MD' },
                      { id: 'lg', name: 'LG' },
                      { id: 'full', name: 'Full' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ maxWidth: w.id as any })}
                        className={`py-1 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.maxWidth || 'full') === w.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Responsive Mobile Stacking */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Stack on Mobile</span>
                    <span className="text-[10px] text-slate-500">Auto-wrap input & button on phones</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={footerConfig.newsletterStyle?.stackOnMobile !== false}
                    onChange={(e) => updateNewsletterStyle({ stackOnMobile: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Typography */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-600" />
                <span>4. Typography & Font Weights</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                {/* Heading Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Heading Size</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'xs', name: 'XS' },
                      { id: 'sm', name: 'SM' },
                      { id: 'base', name: 'Base' },
                      { id: 'lg', name: 'LG' },
                      { id: 'xl', name: 'XL' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ headingFontSize: s.id as any })}
                        className={`py-1 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.headingFontSize || 'sm') === s.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heading Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Heading Weight</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'medium', name: 'Med' },
                      { id: 'semibold', name: 'Semi' },
                      { id: 'bold', name: 'Bold' },
                      { id: 'extrabold', name: 'Extra' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ headingFontWeight: w.id as any })}
                        className={`py-1 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.headingFontWeight || 'extrabold') === w.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Description Size</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'xs', name: 'XS (11px)' },
                      { id: 'sm', name: 'SM (12px)' },
                      { id: 'base', name: 'Base (14px)' },
                    ].map((ds) => (
                      <button
                        key={ds.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ descriptionFontSize: ds.id as any })}
                        className={`py-1 text-[11px] rounded-lg font-semibold border text-center transition-all ${
                          (footerConfig.newsletterStyle?.descriptionFontSize || 'xs') === ds.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ds.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Font Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Button Font Size</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'xs', name: 'XS' },
                      { id: 'sm', name: 'SM' },
                      { id: 'base', name: 'Base' },
                    ].map((bs) => (
                      <button
                        key={bs.id}
                        type="button"
                        onClick={() => updateNewsletterStyle({ buttonFontSize: bs.id as any })}
                        className={`py-1 text-xs rounded-lg font-semibold border transition-all ${
                          (footerConfig.newsletterStyle?.buttonFontSize || 'xs') === bs.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bs.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. ADD SOCIAL PLATFORM MODAL / SELECTOR                                   */}
      {/* ========================================================================= */}
      {showAddPlatformModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-600" />
                  <span>Add Social Platform</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a platform to add its official icon & configure your handle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPlatformModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-200/60"
              >
                ✕
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:bg-white">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={platformSearchQuery}
                  onChange={(e) => setPlatformSearchQuery(e.target.value)}
                  placeholder="Search platform (e.g. Instagram, Reddit, TikTok)..."
                  className="w-full text-xs bg-transparent border-0 outline-none text-slate-900 font-medium"
                  autoFocus
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto text-[11px]">
                {(['all', 'social', 'messaging', 'content'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPlatformCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg capitalize font-bold transition-all ${
                      platformCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Grid List */}
            <div className="p-4 max-h-[360px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPlatforms.map((p) => {
                const isAlreadyAdded = existingPlatformIds.has(p.id) && p.id !== 'custom';

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddPlatform(p)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isAlreadyAdded
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-2xs cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {getSocialPlatformIcon(p.id, 'w-4.5 h-4.5')}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{p.handlePrefix}</span>
                      </div>
                    </div>

                    {isAlreadyAdded ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md shrink-0">
                        Added
                      </span>
                    ) : (
                      <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {SUPPORTED_SOCIAL_PLATFORMS.length} official platforms supported
              </span>
              <button
                type="button"
                onClick={() => setShowAddPlatformModal(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
