import React, { useState } from 'react';
import { ThemeSettings, SiteSettings, Menu, Category, FooterSocialLink } from '../../types/cms';
import { getSocialPlatformIcon } from '../common/SocialIcons';
import {
  ArrowUp,
  Send,
  Heart,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  menus: Menu[];
  categories: Category[];
  onNavigate: (path: string) => void;
  onOpenAdmin?: () => void;
}

const DEFAULT_SOCIAL_FALLBACKS: FooterSocialLink[] = [
  { id: 'soc-instagram', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/astropress', enabled: true, order: 1 },
  { id: 'soc-youtube', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@astropress', enabled: true, order: 2 },
  { id: 'soc-telegram', platform: 'telegram', label: 'Telegram', url: 'https://t.me/astropress', enabled: true, order: 3 },
  { id: 'soc-twitter', platform: 'twitter', label: 'Twitter / X', url: 'https://x.com/astropress', enabled: true, order: 4 },
  { id: 'soc-github', platform: 'github', label: 'GitHub', url: 'https://github.com/astropress', enabled: true, order: 5 },
];

export const WebsiteFooter: React.FC<Props> = ({
  themeSettings,
  siteSettings,
  menus,
  categories,
  onNavigate,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { footer } = themeSettings;
  const newsletterConf = siteSettings?.newsletterSettings;

  const footerMenu =
    menus.find((m) => m.location === (footer?.menuLocation || 'footer')) ||
    menus.find((m) => m.location === 'footer') ||
    menus[0];

  const title = newsletterConf?.title || footer?.newsletterTitle || 'The Headless Dispatch';
  const subtitle =
    newsletterConf?.subtitle ||
    footer?.newsletterSubtitle ||
    'Subscribe to get notified whenever new architectural tutorials or theme updates drop.';
  const placeholder =
    newsletterConf?.placeholderText || footer?.newsletterPlaceholder || 'Enter your email...';
  const buttonText =
    newsletterConf?.buttonText || footer?.newsletterButtonText || 'Subscribe';
  const successMsg =
    newsletterConf?.successMessage || footer?.newsletterSuccessMsg || 'Thank you for subscribing!';

  const columns = footer?.columns ?? 4;
  const showBrandCol = footer?.showBrandCol !== false;
  const showNewsletter = footer?.showNewsletter !== false;
  const showSocialLinks = footer?.showSocialLinks !== false;
  const showBackToTop = footer?.showBackToTop !== false;
  const showLegalLinks = footer?.showLegalLinks !== false;
  const categoriesStyle = footer?.categoriesStyle || 'badges';
  const maxCategories = footer?.maxCategories || 6;
  const maxNavLinks = footer?.maxNavLinks || 5;

  const currentYear = new Date().getFullYear().toString();
  const rawCopyright =
    footer?.copyright ||
    '© {year} {sitename}. Powered by Astro & Sveltia CMS on Cloudflare Pages.';
  const renderedCopyright = rawCopyright
    .replace('{year}', currentYear)
    .replace('{sitename}', footer?.brandTitle || themeSettings.siteName || 'AstroPress');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const email = newsletterEmail.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubscribed(true);
        setSubscriptionMessage(data.message || successMsg);
        setNewsletterEmail('');
      } else {
        setErrorMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      setIsSubscribed(true);
      setSubscriptionMessage(successMsg);
      setNewsletterEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawSocial = Array.isArray(footer?.socialLinks) ? footer.socialLinks : DEFAULT_SOCIAL_FALLBACKS;
  const socialLinksToRender = rawSocial
    .filter((s) => s.enabled === true || (s.enabled !== false && s.enabled !== undefined && Boolean(s.enabled)))
    .filter((s) => s.url && s.url.trim().length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const containerClass =
    footer?.containerWidth === 'wide'
      ? 'max-w-screen-2xl'
      : footer?.containerWidth === 'narrow'
      ? 'max-w-5xl'
      : footer?.containerWidth === 'full'
      ? 'max-w-full px-6'
      : 'max-w-7xl';

  const paddingClass =
    footer?.paddingY === 'compact'
      ? 'pt-10 pb-8'
      : footer?.paddingY === 'spacious'
      ? 'pt-20 pb-16'
      : 'pt-16 pb-12';

  const themeClass =
    footer?.style === 'light'
      ? 'bg-white text-slate-700 border-slate-200'
      : footer?.style === 'subtle'
      ? 'bg-slate-900 text-slate-300 border-slate-800'
      : footer?.style === 'midnight'
      ? 'bg-slate-950 text-slate-300 border-slate-800/90'
      : 'bg-slate-950 text-slate-300 border-slate-800';

  return (
    <footer className={`border-t font-sans transition-colors ${themeClass} ${paddingClass}`}>
      <div className={`${containerClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        {/* Main Columns Grid */}
        <div
          className={`grid gap-10 pb-12 border-b ${
            footer?.style === 'light' ? 'border-slate-200' : 'border-slate-800/80'
          } ${
            columns === 1
              ? 'grid-cols-1 text-center'
              : columns === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : columns === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {/* Column 1: Site Identity */}
          {showBrandCol && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 select-none ${
                  columns === 1 ? 'justify-center' : ''
                }`}
              >
                {footer?.showBrandLogo !== false && (
                  <div
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-xs"
                  >
                    A
                  </div>
                )}
                <span
                  className={`font-extrabold text-xl tracking-tight ${
                    footer?.style === 'light' ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {footer?.brandTitle || themeSettings.siteName}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {footer?.brandDescription ||
                  themeSettings.tagline ||
                  'High-performance headless publishing platform combining the WordPress editorial feel with Astro static speed, Sveltia CMS, and Cloudflare Pages edge delivery.'}
              </p>

              {/* Social Channels Badges */}
              {showSocialLinks && socialLinksToRender.length > 0 && (
                <div
                  className={`flex items-center gap-2.5 pt-2 ${
                    columns === 1 ? 'justify-center' : ''
                  }`}
                >
                  {socialLinksToRender.map((soc) => (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      title={`${soc.label} (${soc.username || soc.url})`}
                    >
                      {getSocialPlatformIcon(soc.platform, 'w-4 h-4')}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Column 2: Quick Links / Navigation */}
          {columns >= 2 && (
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  footer?.style === 'light' ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {footer?.navTitle || 'Quick Links'}
              </h4>
              <ul className="space-y-2 text-xs">
                {footerMenu?.items
                  ?.filter((item) => item.url !== '/admin' && item.url !== '/wpadmin')
                  ?.slice(0, maxNavLinks)
                  ?.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.url)}
                        className="hover:text-white transition-colors hover:translate-x-0.5 transform inline-block text-slate-400"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Column 3: Topics / Categories */}
          {columns >= 3 && (
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  footer?.style === 'light' ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {footer?.categoriesTitle || 'Editorial Topics'}
              </h4>

              {categoriesStyle === 'list' ? (
                <ul className="space-y-2 text-xs">
                  {categories.slice(0, maxCategories).map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => onNavigate(`/category/${cat.slug}`)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        • {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, maxCategories).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onNavigate(`/category/${cat.slug}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {footer?.showTechStackBadges !== false && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block font-semibold mb-1">
                    Architecture
                  </span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    {footer?.techStackBadgesText || '● 100% Git-Backed Markdown & YAML'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Column 4: Newsletter Subscription */}
          {columns >= 4 && showNewsletter && (
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  footer?.style === 'light' ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
              <div className="pt-2">
                {isSubscribed ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{subscriptionMessage || successMsg}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder={placeholder}
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ backgroundColor: themeSettings.primaryColor }}
                        className="px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center shrink-0 disabled:opacity-50"
                        title={buttonText}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </form>
                    {footer?.newsletterDisclaimer && (
                      <p className="text-[10px] text-slate-500">
                        {footer.newsletterDisclaimer}
                      </p>
                    )}
                    {errorMessage && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div
          className={`pt-8 flex flex-col sm:flex-row items-center text-xs text-slate-400 gap-4 ${
            footer?.bottomBarAlignment === 'center'
              ? 'justify-center text-center'
              : 'justify-between'
          }`}
        >
          <div>
            <p>{renderedCopyright}</p>
            {showLegalLinks && (footer?.legalLinks || []).length > 0 && (
              <div
                className={`flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 ${
                  footer?.bottomBarAlignment === 'center' ? 'justify-center' : ''
                }`}
              >
                {(footer?.legalLinks || []).map((leg) => (
                  <button
                    key={leg.id}
                    onClick={() => onNavigate(leg.url)}
                    className="hover:text-slate-300 transition-colors"
                  >
                    {leg.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              {footer?.customCredits || 'Engineered with ❤️ for Astro & Sveltia'}
            </span>
            {showBackToTop && (
              <button
                onClick={scrollToTop}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-2xs"
                title="Back to Top"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
