import React from 'react';

export interface SocialPlatformMeta {
  id: string;
  name: string;
  category: 'social' | 'messaging' | 'content' | 'other';
  handlePrefix: string;
  placeholder: string;
  urlTemplate: (handle: string) => string;
  isCustomUrl?: boolean;
}

export const SUPPORTED_SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    handlePrefix: 'instagram.com/',
    placeholder: '@astropress',
    urlTemplate: (h) => `https://instagram.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    handlePrefix: 'facebook.com/',
    placeholder: 'astropress',
    urlTemplate: (h) => `https://facebook.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'content',
    handlePrefix: 'youtube.com/@',
    placeholder: '@astropress',
    urlTemplate: (h) => (h.startsWith('@') ? `https://youtube.com/${h}` : `https://youtube.com/@${h.replace(/^@/, '')}`),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    handlePrefix: 't.me/',
    placeholder: 'astropress',
    urlTemplate: (h) => `https://t.me/${h.replace(/^@/, '')}`,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    handlePrefix: 'wa.me/ or Link',
    placeholder: '+1234567890 or chat.whatsapp.com/xxx',
    urlTemplate: (h) => {
      const clean = h.trim();
      if (clean.startsWith('http')) return clean;
      if (/^\+?[0-9]+$/.test(clean)) return `https://wa.me/${clean.replace(/^\+/, '')}`;
      return `https://chat.whatsapp.com/${clean}`;
    },
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    category: 'social',
    handlePrefix: 'x.com/',
    placeholder: '@astropress',
    urlTemplate: (h) => `https://x.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    handlePrefix: 'linkedin.com/in/',
    placeholder: 'astropress or company/astropress',
    urlTemplate: (h) => {
      const clean = h.replace(/^@/, '');
      if (clean.startsWith('company/') || clean.startsWith('in/')) return `https://linkedin.com/${clean}`;
      return `https://linkedin.com/in/${clean}`;
    },
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'content',
    handlePrefix: 'github.com/',
    placeholder: 'username',
    urlTemplate: (h) => `https://github.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'messaging',
    handlePrefix: 'discord.gg/',
    placeholder: 'invite-code or full link',
    urlTemplate: (h) => (h.startsWith('http') ? h : `https://discord.gg/${h}`),
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    handlePrefix: 'pinterest.com/',
    placeholder: 'username',
    urlTemplate: (h) => `https://pinterest.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'content',
    handlePrefix: 'tiktok.com/@',
    placeholder: '@astropress',
    urlTemplate: (h) => `https://tiktok.com/@${h.replace(/^@/, '')}`,
  },
  {
    id: 'threads',
    name: 'Threads',
    category: 'social',
    handlePrefix: 'threads.net/@',
    placeholder: '@astropress',
    urlTemplate: (h) => `https://threads.net/@${h.replace(/^@/, '')}`,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'social',
    handlePrefix: 'reddit.com/r/',
    placeholder: 'r/astropress or u/username',
    urlTemplate: (h) => {
      const clean = h.trim();
      if (clean.startsWith('r/') || clean.startsWith('u/') || clean.startsWith('user/')) {
        return `https://reddit.com/${clean}`;
      }
      return `https://reddit.com/r/${clean}`;
    },
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    category: 'social',
    handlePrefix: 'snapchat.com/add/',
    placeholder: 'username',
    urlTemplate: (h) => `https://snapchat.com/add/${h.replace(/^@/, '')}`,
  },
  {
    id: 'medium',
    name: 'Medium',
    category: 'content',
    handlePrefix: 'medium.com/@',
    placeholder: '@astropress',
    urlTemplate: (h) => `https://medium.com/@${h.replace(/^@/, '')}`,
  },
  {
    id: 'custom',
    name: 'Website / Custom',
    category: 'other',
    handlePrefix: 'https://',
    placeholder: 'https://yourwebsite.com/link',
    isCustomUrl: true,
    urlTemplate: (h) => (h.startsWith('http') ? h : `https://${h}`),
  },
];

export function buildPlatformUrl(platform: string, input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const meta = SUPPORTED_SOCIAL_PLATFORMS.find((p) => p.id === platform.toLowerCase());
  if (meta) {
    return meta.urlTemplate(trimmed);
  }
  return `https://${trimmed}`;
}

export function extractHandleFromUrl(platform: string, url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed);
    const pathname = u.pathname.replace(/^\/+|\/+$/g, '');
    if (!pathname) return trimmed;

    switch (platform.toLowerCase()) {
      case 'instagram':
      case 'facebook':
      case 'pinterest':
      case 'github':
        return pathname.split('/')[0] || trimmed;
      case 'youtube':
      case 'tiktok':
      case 'threads':
      case 'medium':
        return pathname.startsWith('@') ? pathname : `@${pathname.split('/')[0]}`;
      case 'telegram':
        return pathname;
      case 'twitter':
      case 'x':
        return `@${pathname.split('/')[0]}`;
      case 'reddit':
        return pathname;
      case 'snapchat':
        return pathname.replace(/^add\//, '');
      case 'linkedin':
      case 'discord':
      case 'whatsapp':
      case 'custom':
      case 'globe':
      default:
        return trimmed;
    }
  } catch {
    return trimmed;
  }
}

/* ========================================================================= */
/* CRISP LOCAL VECTOR SVG BRAND ICONS                                         */
/* ========================================================================= */

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="url(#ig_gradient)" />
    <path
      d="M12 7C9.239 7 7 9.239 7 12s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 8.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4z"
      fill="#FFFFFF"
    />
    <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#FFFFFF" strokeWidth="1.5" />
    <defs>
      <radialGradient id="ig_gradient" cx="0%" cy="100%" r="150%">
        <stop offset="0%" stopColor="#FFD600" />
        <stop offset="25%" stopColor="#FF0100" />
        <stop offset="50%" stopColor="#D800B9" />
        <stop offset="100%" stopColor="#405DE6" />
      </radialGradient>
    </defs>
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#1877F2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M21.582 7.18a2.76 2.76 0 0 0-1.94-1.95C17.928 4.75 12 4.75 12 4.75s-5.928 0-7.642.48a2.76 2.76 0 0 0-1.94 1.95A28.88 28.88 0 0 0 1.938 12a28.88 28.88 0 0 0 .48 4.82 2.76 2.76 0 0 0 1.94 1.95c1.714.48 7.642.48 7.642.48s5.928 0 7.642-.48a2.76 2.76 0 0 0 1.94-1.95c.32-1.74.48-3.48.48-4.82a28.88 28.88 0 0 0-.48-4.82z"
      fill="#FF0000"
    />
    <path d="M10 15.5l5.5-3.5-5.5-3.5v7z" fill="#FFFFFF" />
  </svg>
);

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#229ED9" />
    <path
      d="M17.29 7.73a.8.8 0 0 0-.84-.13L4.9 12.23c-.56.22-.55.53-.1.67l2.96.92 6.86-4.33c.32-.2.62-.09.38.12l-5.56 5.02-.21 3.09c.3 0 .44-.14.61-.31l1.47-1.43 3.06 2.26c.56.31.97.15 1.11-.52l2-9.42c.2-.8-.3-1.17-.79-.97z"
      fill="#FFFFFF"
    />
  </svg>
);

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <path
      d="M17.55 16.275c-.23.65-1.15 1.2-1.6 1.25-.42.05-.96.07-2.8-.66-2.35-.93-3.86-3.32-3.98-3.48-.11-.15-.95-1.26-.95-2.4 0-1.15.6-1.71.81-1.95.22-.23.47-.29.63-.29.16 0 .31.002.45.008.15.007.34-.057.53.4.2.48.67 1.63.73 1.75.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.11-.24.24-.1.48.14.24.62 1.02 1.33 1.65.92.81 1.69 1.07 1.93 1.19.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.59-.17 1.24z"
      fill="#FFFFFF"
    />
  </svg>
);

export const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#0A66C2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#5865F2" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const PinterestIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#E60023" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path
      d="M12 4.5a7.5 7.5 0 0 0-2.74 14.48c-.04-.63-.07-1.6.01-2.29.09-.75.6-2.54.6-2.54s-.15-.31-.15-.76c0-.71.41-1.24.93-1.24.44 0 .65.33.65.73 0 .44-.28 1.1-.43 1.71-.12.52.26.94.77.94 1.23 0 2.06-1.58 2.06-3.46 0-1.42-.96-2.48-2.7-2.48-1.97 0-3.19 1.47-3.19 3.1 0 .56.17 1.16.42 1.47.05.06.05.11.04.18l-.16.65c-.02.1-.09.13-.2.08-.85-.35-1.24-1.29-1.24-2.33 0-1.74 1.47-3.83 4.39-3.83 2.34 0 3.88 1.7 3.88 3.52 0 2.41-1.34 4.21-3.3 4.21-.66 0-1.28-.36-1.5-.77l-.41 1.64c-.15.58-.56 1.31-.83 1.76.62.19 1.28.29 1.96.29A7.5 7.5 0 1 0 12 4.5z"
      fill="#FFFFFF"
    />
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M16.6 8.2c-.85-.56-1.4-1.5-1.45-2.6h-2.3v10.3c0 1.27-1.03 2.3-2.3 2.3s-2.3-1.03-2.3-2.3 1.03-2.3 2.3-2.3c.25 0 .48.04.7.12v-2.4a4.67 4.67 0 0 0-.7-.05c-2.58 0-4.67 2.09-4.67 4.67s2.09 4.67 4.67 4.67 4.67-2.09 4.67-4.67V9.75c1.07.76 2.38 1.2 3.78 1.2v-2.3c-.8-.01-1.55-.2-2.1-.45z"
      fill="#FFFFFF"
    />
  </svg>
);

export const ThreadsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12.186 2.002C6.545 2.002 2 6.547 2 12.188c0 5.64 4.545 10.186 10.186 10.186 3.12 0 5.922-1.397 7.788-3.606l-1.685-1.245c-1.444 1.708-3.61 2.784-6.103 2.784-4.475 0-8.118-3.643-8.118-8.119 0-4.475 3.643-8.118 8.118-8.118 4.476 0 8.119 3.643 8.119 8.118 0 .86-.145 1.706-.416 2.502-.638 1.869-2.22 3.204-4.14 3.498-1.57.241-2.977-.417-3.682-1.722-.52-.962-.647-2.23-.377-3.674.394-2.115 2.128-3.705 4.318-3.961.644-.075 1.303-.027 1.932.14V7.55c-.56-.164-1.157-.22-1.761-.165-2.923.267-5.234 2.388-5.759 5.207-.36 1.928-.19 3.626.504 4.908.972 1.798 2.92 2.697 5.083 2.366 2.57-.393 4.693-2.18 5.547-4.673.363-1.063.557-2.19.557-3.342 0-5.64-4.545-10.186-10.186-10.186zm2.392 8.358c-.184-.047-.373-.06-.566-.038-1.183.139-2.121.999-2.336 2.14-.147.78-.077 1.47.206 1.993.385.71 1.15.96 1.954.836 1.042-.16 1.9-1.026 2.247-2.045.132-.387.2-.797.2-1.218v-.076a4.2 4.2 0 0 0-1.505-1.592z" />
  </svg>
);

export const RedditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FF4500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#FF4500" />
    <path
      d="M19.2 12c0-.77-.63-1.4-1.4-1.4-.38 0-.73.15-.98.4-1.15-.79-2.73-1.3-4.5-1.36l.76-3.6 2.5.53a1.2 1.2 0 1 0 1.22-1.17c-.55 0-1.02.37-1.16.89l-2.8-.59a.3.3 0 0 0-.35.23l-.85 4.02c-1.81.04-3.43.56-4.6 1.36a1.39 1.39 0 0 0-.98-.4c-.77 0-1.4.63-1.4 1.4 0 .54.31 1.01.76 1.24-.04.25-.06.5-.06.76 0 2.65 3.09 4.8 6.9 4.8s6.9-2.15 6.9-4.8c0-.26-.02-.51-.06-.76.45-.23.76-.7.76-1.24zm-10.2 1.2a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0zm6.6 3.1c-.8.8-2.1.9-3.6.9s-2.8-.1-3.6-.9a.3.3 0 0 1 .42-.42c.6.6 1.7.7 3.18.7s2.58-.1 3.18-.7a.3.3 0 0 1 .42.42zm-.6-1.9a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"
      fill="#FFFFFF"
    />
  </svg>
);

export const SnapchatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FFFC00" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#FFFC00" />
    <path
      d="M12 5.5c-2.3 0-3.8 1.7-3.8 3.5 0 .6.2 1.2.4 1.6-.3.1-.7.2-.8.5-.1.3.1.6.4.7-.2.6-.5 1.2-.9 1.7-.3.3-.6.5-.6.8 0 .4.4.6.8.6.4 0 .8-.1 1.2-.3.6 1 1.8 1.4 3.3 1.4s2.7-.4 3.3-1.4c.4.2.8.3 1.2.3.4 0 .8-.2.8-.6 0-.3-.3-.5-.6-.8-.4-.5-.7-1.1-.9-1.7.3-.1.5-.4.4-.7-.1-.3-.5-.4-.8-.5.2-.4.4-1 .4-1.6 0-1.8-1.5-3.5-3.8-3.5z"
      fill="#000000"
    />
  </svg>
);

export const MediumIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

export const CustomGlobeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export function getSocialPlatformIcon(platform?: string, className: string = 'w-4 h-4'): React.ReactNode {
  const key = (platform || '').toLowerCase().trim();
  switch (key) {
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'facebook':
      return <FacebookIcon className={className} />;
    case 'youtube':
      return <YouTubeIcon className={className} />;
    case 'telegram':
      return <TelegramIcon className={className} />;
    case 'whatsapp':
      return <WhatsAppIcon className={className} />;
    case 'twitter':
    case 'x':
      return <XTwitterIcon className={className} />;
    case 'linkedin':
      return <LinkedInIcon className={className} />;
    case 'github':
      return <GitHubIcon className={className} />;
    case 'discord':
      return <DiscordIcon className={className} />;
    case 'pinterest':
      return <PinterestIcon className={className} />;
    case 'tiktok':
      return <TikTokIcon className={className} />;
    case 'threads':
      return <ThreadsIcon className={className} />;
    case 'reddit':
      return <RedditIcon className={className} />;
    case 'snapchat':
      return <SnapchatIcon className={className} />;
    case 'medium':
      return <MediumIcon className={className} />;
    case 'globe':
    case 'custom':
    default:
      return <CustomGlobeIcon className={className} />;
  }
}
