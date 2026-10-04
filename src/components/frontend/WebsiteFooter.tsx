import React, { useState } from 'react';
import { ThemeSettings, Menu, Category } from '../../types/cms';
import { Github, Twitter, Globe, ArrowUp, Send, Heart, Check } from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  menus: Menu[];
  categories: Category[];
  onNavigate: (path: string) => void;
  onOpenAdmin?: () => void;
}

export const WebsiteFooter: React.FC<Props> = ({
  themeSettings,
  menus,
  categories,
  onNavigate,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const footerMenu = menus.find((m) => m.location === 'footer') || menus[0];
  const { footer } = themeSettings;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: Site Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 select-none">
              <div
                style={{ backgroundColor: themeSettings.primaryColor }}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-xs"
              >
                A
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                {themeSettings.siteName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {themeSettings.tagline ||
                'High-performance headless publishing platform combining the WordPress editorial feel with Astro static speed, Sveltia CMS, and Cloudflare Pages edge delivery.'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
                title="GitHub Repository"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
                title="Twitter / X"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://cloudflare.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
                title="Cloudflare Edge"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              {footerMenu?.items
                ?.filter((item) => item.url !== '/admin')
                ?.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.url)}
                      className="hover:text-white transition-colors hover:translate-x-0.5 transform inline-block"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* Column 3: Topics / Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Editorial Topics</h4>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(`/category/${cat.slug}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block font-semibold mb-1">Architecture</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                ● 100% Git-Backed Markdown & YAML
              </span>
            </div>
          </div>

          {/* Column 4: Newsletter Subscription */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {footer.newsletterTitle || 'The Headless Dispatch'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {footer.newsletterSubtitle ||
                'Subscribe to get notified whenever new architectural tutorials or theme updates drop.'}
            </p>
            <div className="pt-2">
              {isSubscribed ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="submit"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center shrink-0"
                    title="Subscribe to Dispatch"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{footer.copyright}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Engineered with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for Astro & Sveltia
            </span>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Back to Top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
