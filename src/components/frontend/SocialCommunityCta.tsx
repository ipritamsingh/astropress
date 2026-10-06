import React from 'react';
import { CommunityLink } from '../../types/cms';
import { Send, MessageSquare, Youtube, Twitter, MessageCircle, Share2 } from 'lucide-react';

interface Props {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  communityLinks?: CommunityLink[];
}

export const SocialCommunityCta: React.FC<Props> = ({
  enabled = true,
  title,
  subtitle,
  communityLinks,
}) => {
  if (enabled === false) {
    return null;
  }

  const enabledLinks = (communityLinks || [])
    .filter((link) => link && link.enabled !== false && link.url && link.url.trim().length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderIcon = (platform?: string) => {
    const key = (platform || '').toLowerCase();
    switch (key) {
      case 'telegram':
        return <Send className="h-5 w-5 text-sky-500 shrink-0" />;
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5 text-emerald-600 shrink-0" />;
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-600 shrink-0" />;
      case 'twitter':
      case 'x':
        return <Twitter className="h-5 w-5 text-sky-500 shrink-0" />;
      case 'discord':
        return <MessageCircle className="h-5 w-5 text-indigo-600 shrink-0" />;
      default:
        return <Share2 className="h-5 w-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-12 font-sans">
      <div className="relative overflow-hidden rounded-3xl bg-blue-600 text-white p-8 md:p-12 shadow-xl border border-blue-500/20">
        {/* Subtle decorative circles for a premium SaaS feel */}
        <div className="absolute top-0 right-0 h-40 w-44 rounded-full bg-white/5 blur-2xl -translate-y-12 translate-x-12 select-none pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-40 w-44 rounded-full bg-white/5 blur-2xl translate-y-12 -translate-x-12 select-none pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/15 px-3.5 py-1.5 rounded-full text-white inline-block border border-white/10 shadow-xs">
            Official Channels
          </span>
          
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {title || 'Join Our Community'}
            </h2>
            <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-2xl mx-auto font-medium opacity-95">
              {subtitle ||
                'Get the latest updates, resources, new articles and exclusive content directly through our social channels.'}
            </p>
          </div>

          {enabledLinks.length > 0 && (
            <div className={`grid grid-cols-1 gap-4 pt-4 w-full max-w-3xl mx-auto ${
              enabledLinks.length === 2 
                ? 'sm:grid-cols-2 max-w-xl' 
                : enabledLinks.length >= 3 
                ? 'sm:grid-cols-3' 
                : 'max-w-md'
            }`}>
              {enabledLinks.map((link) => {
                let safeUrl = link.url.trim();
                if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
                  safeUrl = `https://${safeUrl}`;
                }
                return (
                  <a
                    key={link.id}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-extrabold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {renderIcon(link.platform)}
                    <span>{link.label || link.platform}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
