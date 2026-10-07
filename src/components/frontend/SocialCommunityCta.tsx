import React from 'react';
import { CommunityLink } from '../../types/cms';
import { Share2 } from 'lucide-react';

interface Props {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  communityLinks?: CommunityLink[];
}

/** Authentic Official Platform SVGs (Scaled to 28-30px prominent visual size) */
const TelegramLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7 sm:w-7.5 sm:h-7.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-4.71-4.27a.8.8 0 0 0-.84-.13L4.9 12.23c-.56.22-.55.53-.1.67l2.96.92 6.86-4.33c.32-.2.62-.09.38.12l-5.56 5.02-.21 3.09c.3 0 .44-.14.61-.31l1.47-1.43 3.06 2.26c.56.31.97.15 1.11-.52l2-9.42c.2-.8-.3-1.17-.79-.97z"
      fill="#229ED9"
    />
  </svg>
);

const WhatsAppLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7 sm:w-7.5 sm:h-7.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2.1 21.9l4.877-1.28A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm5.55 14.275c-.23.65-1.15 1.2-1.6 1.25-.42.05-.96.07-2.8-.66-2.35-.93-3.86-3.32-3.98-3.48-.11-.15-.95-1.26-.95-2.4 0-1.15.6-1.71.81-1.95.22-.23.47-.29.63-.29.16 0 .31.002.45.008.15.007.34-.057.53.4.2.48.67 1.63.73 1.75.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.11-.24.24-.1.48.14.24.62 1.02 1.33 1.65.92.81 1.69 1.07 1.93 1.19.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.59-.17 1.24z"
      fill="#25D366"
    />
  </svg>
);

const YouTubeLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7 sm:w-7.5 sm:h-7.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M21.582 7.18a2.76 2.76 0 0 0-1.94-1.95C17.928 4.75 12 4.75 12 4.75s-5.928 0-7.642.48a2.76 2.76 0 0 0-1.94 1.95A28.88 28.88 0 0 0 1.938 12a28.88 28.88 0 0 0 .48 4.82 2.76 2.76 0 0 0 1.94 1.95c1.714.48 7.642.48 7.642.48s5.928 0 7.642-.48a2.76 2.76 0 0 0 1.94-1.95c.32-1.74.48-3.48.48-4.82a28.88 28.88 0 0 0-.48-4.82z"
      fill="#FF0000"
    />
    <path d="M10 15.5l5.5-3.5-5.5-3.5v7z" fill="#FFFFFF" />
  </svg>
);

const XTwitterLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#0F1419" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordLogo: React.FC<{ className?: string }> = ({ className = 'w-6.5 h-6.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#5865F2" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

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

  if (enabledLinks.length === 0) {
    return null;
  }

  const renderOfficialLogo = (platform?: string) => {
    const key = (platform || '').toLowerCase().trim();
    switch (key) {
      case 'telegram':
        return <TelegramLogo className="w-7 h-7 sm:w-7.5 sm:h-7.5 shrink-0" />;
      case 'whatsapp':
        return <WhatsAppLogo className="w-7 h-7 sm:w-7.5 sm:h-7.5 shrink-0" />;
      case 'youtube':
        return <YouTubeLogo className="w-7 h-7 sm:w-7.5 sm:h-7.5 shrink-0" />;
      case 'twitter':
      case 'x':
        return <XTwitterLogo className="w-6 h-6 shrink-0" />;
      case 'discord':
        return <DiscordLogo className="w-6.5 h-6.5 shrink-0" />;
      default:
        return <Share2 className="w-6 h-6 text-blue-600 shrink-0" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-14 md:my-20 font-sans">
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-[#0c2363] via-[#1d4ed8] to-[#1e40af] text-white p-8 sm:p-12 md:p-16 shadow-2xl shadow-blue-950/25 border border-blue-400/30">
        {/* Subtle decorative background depth & glow orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] opacity-35 select-none pointer-events-none" />
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-cyan-400/[0.14] blur-3xl -translate-y-32 translate-x-32 select-none pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-400/[0.16] blur-3xl translate-y-32 -translate-x-32 select-none pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-400/[0.08] blur-3xl select-none pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Top Badge: 👑 OFFICIAL CHANNELS */}
          <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white shadow-sm mb-5 sm:mb-6 select-none">
            <span className="text-amber-300 text-xs" role="img" aria-label="crown">👑</span>
            <span>Official Channels</span>
          </div>

          {/* Main Heading: Join Our Community */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.85rem] font-black tracking-tight text-white leading-[1.15] mb-3.5 sm:mb-4">
            {title || 'Join Our Community'}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-blue-100/90 leading-relaxed max-w-xl mx-auto font-normal mb-8 sm:mb-10">
            {subtitle ||
              'Get the latest updates, resources, new articles and exclusive content directly through our social channels.'}
          </p>

          {/* Social Buttons Container */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md sm:max-w-none">
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
                  className="group inline-flex items-center justify-center gap-3.5 sm:gap-4 min-h-[58px] sm:min-h-[62px] px-6 sm:px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-white/95 shadow-md hover:shadow-xl hover:shadow-blue-950/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base font-extrabold cursor-pointer select-none"
                >
                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                    {renderOfficialLogo(link.platform)}
                  </span>
                  <span className="tracking-tight text-slate-900 group-hover:text-black">
                    {link.label || link.platform}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};


