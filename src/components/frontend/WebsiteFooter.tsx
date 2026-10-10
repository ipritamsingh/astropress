import React from 'react';
import { ThemeSettings, SiteSettings, Menu, Category, FooterSocialLink } from '../../types/cms';
import { getSocialPlatformIcon } from '../common/SocialIcons';
import { FooterNewsletterCard } from '../common/FooterNewsletterCard';
import {
  ArrowUp,
  Heart,
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
  const { footer } = themeSettings;

  const footerMenu =
    menus.find((m) => m.location === (footer?.menuLocation || 'footer')) ||
    menus.find((m) => m.location === 'footer') ||
    menus[0];

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

          {/* Column 4: Newsletter Subscription Card */}
          {columns >= 4 && showNewsletter && (
            <div className="w-full">
              <FooterNewsletterCard
                footerConfig={footer}
                siteSettings={siteSettings}
              />
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
