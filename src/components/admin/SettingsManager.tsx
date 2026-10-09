import React, { useState, useEffect } from 'react';
import { ThemeSettings, SiteSettings, CommunityLink, NewsletterSettings } from '../../types/cms';
import { Settings, Save, Check, Plus, Trash2, ArrowUp, ArrowDown, Share2, Mail, AlertTriangle } from 'lucide-react';

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
  const [pagePermalinkStructure, setPagePermalinkStructure] = useState(
    siteSettings?.pagePermalinkStructure || '/%pagename%/'
  );

  // Community CTA State
  const [communityCtaEnabled, setCommunityCtaEnabled] = useState<boolean>(
    siteSettings?.communityCtaEnabled !== false
  );
  const [communityCtaTitle, setCommunityCtaTitle] = useState(
    siteSettings?.communityCtaTitle || 'Join Our Community'
  );
  const [communityCtaSubtitle, setCommunityCtaSubtitle] = useState(
    siteSettings?.communityCtaSubtitle ||
      'Get the latest updates, resources, new articles and exclusive content directly through our social channels.'
  );
  const [communityLinks, setCommunityLinks] = useState<CommunityLink[]>(
    siteSettings?.communityLinks || [
      {
        id: 'comm-1',
        platform: 'telegram',
        label: 'Join Telegram',
        url: 'https://t.me/astropress',
        enabled: true,
        order: 1,
      },
      {
        id: 'comm-2',
        platform: 'whatsapp',
        label: 'Join WhatsApp',
        url: 'https://chat.whatsapp.com/astropress',
        enabled: true,
        order: 2,
      },
      {
        id: 'comm-3',
        platform: 'youtube',
        label: 'Subscribe on YouTube',
        url: 'https://youtube.com/@astropress',
        enabled: true,
        order: 3,
      },
    ]
  );

  // Footer Newsletter State
  const [newsletterTitle, setNewsletterTitle] = useState(
    siteSettings?.newsletterSettings?.title || 'The Headless Dispatch'
  );
  const [newsletterSubtitle, setNewsletterSubtitle] = useState(
    siteSettings?.newsletterSettings?.subtitle ||
      'Get the latest articles, tutorials and updates directly in your inbox.'
  );
  const [newsletterPlaceholder, setNewsletterPlaceholder] = useState(
    siteSettings?.newsletterSettings?.placeholderText || 'Enter your email...'
  );
  const [newsletterButtonText, setNewsletterButtonText] = useState(
    siteSettings?.newsletterSettings?.buttonText || 'Subscribe'
  );
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = useState(
    siteSettings?.newsletterSettings?.successMessage || 'Thanks for subscribing to The Headless Dispatch!'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (siteSettings?.permalinkStructure) {
      setPermalinkStructure(siteSettings.permalinkStructure);
    }
    if (siteSettings?.pagePermalinkStructure) {
      setPagePermalinkStructure(siteSettings.pagePermalinkStructure);
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
    if (siteSettings?.communityCtaEnabled !== undefined) {
      setCommunityCtaEnabled(siteSettings.communityCtaEnabled !== false);
    }
    if (siteSettings?.communityCtaTitle) {
      setCommunityCtaTitle(siteSettings.communityCtaTitle);
    }
    if (siteSettings?.communityCtaSubtitle) {
      setCommunityCtaSubtitle(siteSettings.communityCtaSubtitle);
    }
    if (siteSettings?.communityLinks) {
      setCommunityLinks(siteSettings.communityLinks);
    }
    if (siteSettings?.newsletterSettings) {
      setNewsletterTitle(siteSettings.newsletterSettings.title || 'The Headless Dispatch');
      setNewsletterSubtitle(
        siteSettings.newsletterSettings.subtitle ||
          'Get the latest articles, tutorials and updates directly in your inbox.'
      );
      setNewsletterPlaceholder(siteSettings.newsletterSettings.placeholderText || 'Enter your email...');
      setNewsletterButtonText(siteSettings.newsletterSettings.buttonText || 'Subscribe');
      setNewsletterSuccessMessage(
        siteSettings.newsletterSettings.successMessage || 'Thanks for subscribing to The Headless Dispatch!'
      );
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
        pagePermalinkStructure,
        communityCtaEnabled,
        communityCtaTitle,
        communityCtaSubtitle,
        communityLinks,
        newsletterSettings: {
          enabled: true,
          title: newsletterTitle,
          subtitle: newsletterSubtitle,
          placeholderText: newsletterPlaceholder,
          buttonText: newsletterButtonText,
          successMessage: newsletterSuccessMessage,
        },
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddCommunityLink = () => {
    const newLink: CommunityLink = {
      id: `comm-${Date.now()}`,
      platform: 'telegram',
      label: 'New Channel',
      url: 'https://',
      enabled: true,
      order: communityLinks.length + 1,
    };
    setCommunityLinks([...communityLinks, newLink]);
  };

  const handleUpdateCommunityLink = (id: string, updates: Partial<CommunityLink>) => {
    setCommunityLinks(
      communityLinks.map((link) => (link.id === id ? { ...link, ...updates } : link))
    );
  };

  const handleDeleteCommunityLink = (id: string) => {
    setCommunityLinks(communityLinks.filter((link) => link.id !== id));
  };

  const handleMoveCommunityLink = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === communityLinks.length - 1)
    ) {
      return;
    }
    const newLinks = [...communityLinks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    // reassign order numbers
    newLinks.forEach((link, i) => {
      link.order = i + 1;
    });

    setCommunityLinks(newLinks);
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

      {/* Page Permalink Structure Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Page Permalink Structure
        </h3>
        <p className="text-slate-500">
          Select the public URL routing structure for standalone static pages:
        </p>
        <div className="space-y-2">
          {[
            {
              label: 'Page name (Root-level)',
              format: '/%pagename%/',
              example: '/about/, /contact/, /privacy-policy/',
            },
            {
              label: 'Default directory prefix',
              format: '/pages/%pagename%/',
              example: '/pages/about/, /pages/contact/, /pages/privacy-policy/',
            },
          ].map((item) => (
            <label
              key={item.format}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                pagePermalinkStructure === item.format
                  ? 'bg-blue-50 border-blue-400 font-bold text-blue-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="page_permalink"
                checked={pagePermalinkStructure === item.format}
                onChange={() => setPagePermalinkStructure(item.format)}
                className="text-blue-600"
              />
              <div>
                <span className="block">{item.label}</span>
                <code className="text-[11px] text-slate-400 font-mono">
                  {item.format} &mdash; <span className="text-slate-500">{item.example}</span>
                </code>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Social / Community CTA & Links Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Blue CTA: Social & Community Section
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddCommunityLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Community Link</span>
          </button>
        </div>

        <p className="text-slate-500 text-xs">
          This blue CTA section replaces the previous email box and appears right above the footer across all public pages.
        </p>

        {/* Global Master Enable/Disable Toggle */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="communityCtaEnabledToggle" className="font-bold text-slate-900 text-xs flex items-center gap-2 cursor-pointer select-none">
              <input
                id="communityCtaEnabledToggle"
                type="checkbox"
                checked={communityCtaEnabled}
                onChange={(e) => setCommunityCtaEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Enable Blue Social/Community CTA</span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6">
              When enabled, the blue Social/Community section is displayed on public pages.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
            communityCtaEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {communityCtaEnabled ? 'ON' : 'OFF'}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Section Title</label>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={communityCtaTitle}
                onChange={(e) => setCommunityCtaTitle(e.target.value)}
                placeholder="Join Our Community"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium text-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Section Description</label>
            <div className="sm:col-span-2">
              <textarea
                rows={2}
                value={communityCtaSubtitle}
                onChange={(e) => setCommunityCtaSubtitle(e.target.value)}
                placeholder="Get the latest updates, resources, new articles and exclusive content directly through our social channels."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 text-slate-800 text-xs resize-none"
              />
            </div>
          </div>

          {/* Links list */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-800 block">Community Buttons & Channels ({communityLinks.length})</span>
            {communityLinks.map((link, index) => (
              <div
                key={link.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) =>
                          handleUpdateCommunityLink(link.id, { enabled: e.target.checked })
                        }
                        className="rounded text-blue-600"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveCommunityLink(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCommunityLink(index, 'down')}
                      disabled={index === communityLinks.length - 1}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCommunityLink(link.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50"
                      title="Delete Link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">Platform</label>
                    <select
                      value={link.platform}
                      onChange={(e) =>
                        handleUpdateCommunityLink(link.id, {
                          platform: e.target.value as CommunityLink['platform'],
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs"
                    >
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="youtube">YouTube</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="discord">Discord</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">Button Label</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) =>
                        handleUpdateCommunityLink(link.id, { label: e.target.value })
                      }
                      placeholder="e.g. Join Telegram"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">Target URL</label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) =>
                        handleUpdateCommunityLink(link.id, { url: e.target.value })
                      }
                      placeholder="https://t.me/astropress"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Newsletter Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Mail className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Footer Email Newsletter Settings
          </h3>
        </div>

        <p className="text-slate-500 text-xs">
          Manage the newsletter subscription box that remains exclusively in the website footer.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Headline</label>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newsletterTitle}
                onChange={(e) => setNewsletterTitle(e.target.value)}
                placeholder="The Headless Dispatch"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium text-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Subtitle / Description</label>
            <div className="sm:col-span-2">
              <textarea
                rows={2}
                value={newsletterSubtitle}
                onChange={(e) => setNewsletterSubtitle(e.target.value)}
                placeholder="Get the latest articles, tutorials and updates directly in your inbox."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 text-slate-800 text-xs resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Input Placeholder</label>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newsletterPlaceholder}
                onChange={(e) => setNewsletterPlaceholder(e.target.value)}
                placeholder="Enter your email..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Subscribe Button Label</label>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newsletterButtonText}
                onChange={(e) => setNewsletterButtonText(e.target.value)}
                placeholder="Subscribe"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label className="font-semibold text-slate-700">Success Message</label>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newsletterSuccessMessage}
                onChange={(e) => setNewsletterSuccessMessage(e.target.value)}
                placeholder="Thanks for subscribing to The Headless Dispatch!"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
          </div>
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
