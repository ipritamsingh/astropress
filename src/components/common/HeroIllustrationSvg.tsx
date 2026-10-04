import React from 'react';

interface Props {
  className?: string;
  accentColor?: string;
  secondaryColor?: string;
  customSvgContent?: string;
  illustrationType?: 'default-svg' | 'custom-svg' | 'code-window' | 'floating-cards';
}

/**
 * Sanitize uploaded/custom SVG strings to prevent XSS.
 * Removes <script>, event handlers (onload, onclick, onerror), javascript: URIs, iframes, objects, and embed tags.
 */
export function sanitizeSvgContent(rawSvg: string): string {
  if (!rawSvg) return '';
  return rawSvg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, 'blocked-scheme:')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .trim();
}

export const HeroIllustrationSvg: React.FC<Props> = ({
  className = 'w-full h-auto',
  accentColor = '#2563eb',
  secondaryColor = '#06b6d4',
  customSvgContent,
  illustrationType = 'default-svg',
}) => {
  // If user provided sanitized custom SVG
  if (illustrationType === 'custom-svg' && customSvgContent) {
    const cleanSvg = sanitizeSvgContent(customSvgContent);
    return (
      <div
        className={`hero-svg-custom-container select-none ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );
  }

  // Otherwise render rich, scalable, dynamic SVG illustration
  return (
    <div className={`relative select-none ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 580"
        className="w-full h-auto drop-shadow-2xl"
        fill="none"
      >
        <defs>
          {/* Dynamic Ambient Radiant Glows */}
          <radialGradient id="heroDynGlow1" cx="50%" cy="40%" r="60%" fx="30%" fy="30%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
            <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heroDynGlow2" cx="75%" cy="75%" r="50%">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.30" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heroDynGlow3" cx="20%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>

          {/* Linear Gradients */}
          <linearGradient id="heroDynWindowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="heroDynBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="heroDynCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
          </linearGradient>

          <filter id="heroDropShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000000" floodOpacity="0.5" />
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={accentColor} floodOpacity="0.2" />
          </filter>

          <filter id="heroCardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Ambient Glows */}
        <circle cx="410" cy="270" r="310" fill="url(#heroDynGlow1)" />
        <circle cx="640" cy="380" r="210" fill="url(#heroDynGlow2)" />
        <circle cx="160" cy="410" r="170" fill="url(#heroDynGlow3)" />

        {/* Subtle Tech Dot Matrix Grid */}
        <g opacity="0.18">
          {[80, 140, 200, 260, 320, 380, 440, 500, 560, 620, 680, 740].map((x, i) => (
            <React.Fragment key={i}>
              <circle cx={x} cy="70" r="1.5" fill="#94a3b8" />
              <circle cx={x} cy="130" r="1.5" fill="#94a3b8" />
              <circle cx={x} cy="490" r="1.5" fill="#94a3b8" />
              <circle cx={x} cy="550" r="1.5" fill="#94a3b8" />
            </React.Fragment>
          ))}
        </g>

        {/* Connecting Isometric Circuit Lines */}
        <g stroke={accentColor} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.3">
          <path d="M 110 170 L 210 210 L 210 390" />
          <path d="M 690 150 L 590 190 L 590 330" />
          <path d="M 660 470 L 550 430" />
        </g>

        {/* MAIN TECH LAPTOP / CODE EDITOR CONTAINER */}
        <g transform="translate(135, 60)" filter="url(#heroDropShadow)">
          {/* Main Bezel */}
          <rect
            x="0"
            y="0"
            width="530"
            height="375"
            rx="20"
            fill="url(#heroDynWindowGrad)"
            stroke="url(#heroDynBorderGrad)"
            strokeWidth="1.5"
          />

          {/* Window Header Bar */}
          <path d="M 0 20 Q 0 0 20 0 L 510 0 Q 530 0 530 20 L 530 46 L 0 46 Z" fill="#0b1120" />
          <line x1="0" y1="46" x2="530" y2="46" stroke="#1e293b" strokeWidth="1" />

          {/* Traffic Light Dots */}
          <circle cx="24" cy="23" r="5.5" fill="#ef4444" />
          <circle cx="42" cy="23" r="5.5" fill="#f59e0b" />
          <circle cx="60" cy="23" r="5.5" fill="#10b981" />

          {/* Tabs */}
          <g transform="translate(95, 10)">
            <rect
              x="0"
              y="0"
              width="135"
              height="28"
              rx="7"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            <circle cx="16" cy="14" r="3.5" fill={accentColor} />
            <text
              x="28"
              y="18"
              fill="#f8fafc"
              fontFamily="ui-monospace, monospace"
              fontSize="11"
              fontWeight="600"
            >
              index.astro
            </text>

            <rect x="143" y="0" width="140" height="28" rx="7" fill="#0f172a" opacity="0.6" />
            <circle cx="159" cy="14" r="3.5" fill={secondaryColor} />
            <text
              x="171"
              y="18"
              fill="#94a3b8"
              fontFamily="ui-monospace, monospace"
              fontSize="11"
            >
              Gutenberg.tsx
            </text>
          </g>

          {/* Framework Badge */}
          <g transform="translate(420, 11)">
            <rect
              x="0"
              y="0"
              width="95"
              height="24"
              rx="12"
              fill="#064e3b"
              stroke="#059669"
              strokeWidth="1"
            />
            <circle cx="14" cy="12" r="3.5" fill="#34d399" />
            <text
              x="24"
              y="16"
              fill="#a7f3d0"
              fontFamily="system-ui, sans-serif"
              fontSize="10"
              fontWeight="700"
            >
              Astro v5 Edge
            </text>
          </g>

          {/* Line Numbers */}
          <g
            transform="translate(15, 62)"
            fill="#475569"
            fontFamily="ui-monospace, monospace"
            fontSize="11"
            textAnchor="end"
          >
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'].map(
              (n, idx) => (
                <text key={n} x="15" y={18 + idx * 20}>
                  {n}
                </text>
              )
            )}
          </g>
          <line x1="38" y1="52" x2="38" y2="345" stroke="#1e293b" strokeWidth="1" />

          {/* High-Fidelity Code Editor Syntax */}
          <g
            transform="translate(52, 62)"
            fontFamily="ui-monospace, 'Fira Code', monospace"
            fontSize="12"
          >
            <text x="0" y="18" fill="#ec4899">---</text>
            <text x="0" y="38">
              <tspan fill="#ec4899">import</tspan>
              <tspan fill="#f8fafc"> &#123; getCollection &#125; </tspan>
              <tspan fill="#ec4899">from</tspan>
              <tspan fill={secondaryColor}> 'astro:content'</tspan>
              <tspan fill="#94a3b8">;</tspan>
            </text>
            <text x="0" y="58">
              <tspan fill="#ec4899">import</tspan>
              <tspan fill="#f8fafc"> &#123; HeroSection &#125; </tspan>
              <tspan fill="#ec4899">from</tspan>
              <tspan fill={secondaryColor}> './components/Hero'</tspan>
              <tspan fill="#94a3b8">;</tspan>
            </text>
            <text x="0" y="78">
              <tspan fill="#ec4899">export const</tspan>
              <tspan fill="#818cf8"> prerender</tspan>
              <tspan fill="#94a3b8"> = </tspan>
              <tspan fill="#f59e0b">true</tspan>
              <tspan fill="#94a3b8">; </tspan>
              <tspan fill="#64748b">// ⚡ Cloudflare Edge Static</tspan>
            </text>
            <text x="0" y="98">
              <tspan fill="#ec4899">const</tspan>
              <tspan fill="#f8fafc"> posts </tspan>
              <tspan fill="#94a3b8">= </tspan>
              <tspan fill="#ec4899">await</tspan>
              <tspan fill={secondaryColor}> getCollection</tspan>
              <tspan fill="#f8fafc">('posts');</tspan>
            </text>
            <text x="0" y="118" fill="#ec4899">---</text>

            {/* Template markup */}
            <text x="0" y="146" fill={secondaryColor}>
              &lt;<tspan fill="#f43f5e">Layout</tspan> <tspan fill="#a7f3d0">title</tspan>=<tspan fill="#fcd34d">"AstroPress"</tspan>&gt;
            </text>
            <text x="16" y="170" fill={secondaryColor}>
              &lt;<tspan fill="#60a5fa">HeroSection</tspan> <tspan fill="#a7f3d0">client:load</tspan>&gt;
            </text>
            <text x="32" y="194">
              <tspan fill={secondaryColor}>&lt;<tspan fill="#f43f5e">h1</tspan>&gt;</tspan>
              <tspan fill="#f8fafc">Next-Gen Publishing</tspan>
              <tspan fill={secondaryColor}>&lt;/<tspan fill="#f43f5e">h1</tspan>&gt;</tspan>
            </text>
            <text x="32" y="218">
              <tspan fill={secondaryColor}>&lt;<tspan fill="#f43f5e">p</tspan>&gt;</tspan>
              <tspan fill="#94a3b8">Automated WebP + Sveltia CMS</tspan>
              <tspan fill={secondaryColor}>&lt;/<tspan fill="#f43f5e">p</tspan>&gt;</tspan>
            </text>
            <text x="16" y="242" fill={secondaryColor}>
              &lt;/<tspan fill="#60a5fa">HeroSection</tspan>&gt;
            </text>
            <text x="0" y="266" fill={secondaryColor}>
              &lt;/<tspan fill="#f43f5e">Layout</tspan>&gt;
            </text>
          </g>

          {/* Bottom Status Bar */}
          <path d="M 0 345 L 530 345 L 530 355 Q 530 375 510 375 L 20 375 Q 0 375 0 355 Z" fill="#090d16" />
          <g transform="translate(16, 362)" fontFamily="system-ui, sans-serif" fontSize="10" fill="#64748b">
            <text x="0" y="0">⚡ Astro 5.4</text>
            <text x="80" y="0">📦 Sveltia CMS</text>
            <text x="175" y="0">🖼️ WebP Auto-Optimize</text>
            <text x="320" y="0">🚀 Cloudflare Pages</text>
            <text x="460" y="0" fill="#34d399" fontWeight="700">● 100% Synced</text>
          </g>
        </g>

        {/* FLOATING GLASS CARD 1: Core Web Vitals (Top Left) */}
        <g transform="translate(55, 140)" filter="url(#heroCardShadow)">
          <rect
            x="0"
            y="0"
            width="180"
            height="95"
            rx="16"
            fill="url(#heroDynCardGrad)"
            stroke="url(#heroDynBorderGrad)"
            strokeWidth="1.2"
          />
          <circle cx="34" cy="36" r="18" fill="#064e3b" />
          <circle
            cx="34"
            cy="36"
            r="14"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="75 10"
          />
          <text
            x="34"
            y="40"
            fill="#34d399"
            fontFamily="system-ui, sans-serif"
            fontSize="12"
            fontWeight="800"
            textAnchor="middle"
          >
            100
          </text>
          <text x="64" y="32" fill="#f8fafc" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700">
            Core Web Vitals
          </text>
          <text x="64" y="48" fill="#94a3b8" fontFamily="system-ui, sans-serif" fontSize="10">
            Zero Unnecessary JS
          </text>
          <line x1="16" y1="65" x2="164" y2="65" stroke="#334155" strokeWidth="1" />
          <text x="16" y="80" fill={secondaryColor} fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600">
            ⚡ Astro Islands Engine
          </text>
        </g>

        {/* FLOATING GLASS CARD 2: WebP Optimization Savings (Bottom Right) */}
        <g transform="translate(560, 295)" filter="url(#heroCardShadow)">
          <rect
            x="0"
            y="0"
            width="195"
            height="105"
            rx="16"
            fill="url(#heroDynCardGrad)"
            stroke="url(#heroDynBorderGrad)"
            strokeWidth="1.2"
          />
          <g transform="translate(18, 18)">
            <rect x="0" y="0" width="32" height="32" rx="8" fill="#1e3a8a" />
            <path d="M 10 22 L 16 12 L 22 22 Z" fill="#60a5fa" />
            <circle cx="20" cy="14" r="2.5" fill="#f59e0b" />
            <text x="42" y="14" fill="#f8fafc" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700">
              WebP Conversion
            </text>
            <text x="42" y="28" fill="#34d399" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="800">
              -68% Avg. Payload
            </text>
            <line x1="0" y1="44" x2="160" y2="44" stroke="#334155" strokeWidth="1" />
            <g transform="translate(0, 58)">
              <rect x="0" y="0" width="70" height="14" rx="4" fill="#334155" opacity="0.6" />
              <text x="35" y="10" fill="#94a3b8" fontFamily="ui-monospace, monospace" fontSize="9" textAnchor="middle">
                850 KB JPG
              </text>
              <text x="80" y="11" fill="#f8fafc" fontFamily="system-ui, sans-serif" fontSize="10">
                →
              </text>
              <rect x="92" y="0" width="68" height="14" rx="4" fill="#065f46" />
              <text
                x="126"
                y="10"
                fill="#a7f3d0"
                fontFamily="ui-monospace, monospace"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                272 KB WebP
              </text>
            </g>
          </g>
        </g>

        {/* FLOATING GLASS CARD 3: Single Commit Git Push (Bottom Left) */}
        <g transform="translate(85, 395)" filter="url(#heroCardShadow)">
          <rect
            x="0"
            y="0"
            width="205"
            height="75"
            rx="14"
            fill="url(#heroDynCardGrad)"
            stroke="url(#heroDynBorderGrad)"
            strokeWidth="1.2"
          />
          <g transform="translate(16, 16)">
            <circle cx="12" cy="12" r="10" fill="#312e81" />
            <path
              d="M 8 7 A 2 2 0 1 0 8 11 A 2 2 0 1 0 8 7 M 8 11 L 8 17 M 16 9 A 2 2 0 1 0 16 13 A 2 2 0 1 0 16 9 M 8 14 Q 12 14 16 11"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="1.5"
            />
            <text x="30" y="10" fill="#f8fafc" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="700">
              Atomic GitHub Push
            </text>
            <text x="30" y="24" fill="#94a3b8" fontFamily="system-ui, sans-serif" fontSize="10">
              1 Commit · 1 Cloudflare Build
            </text>
            <text x="0" y="44" fill="#60a5fa" fontFamily="ui-monospace, monospace" fontSize="9">
              commit 7a4f91b (HEAD -&gt; main)
            </text>
          </g>
        </g>

        {/* Floating Code Particles */}
        <g opacity="0.8">
          <polygon points="580,95 583,103 591,106 583,109 580,117 577,109 569,106 577,103" fill="#fbbf24" />
          <polygon points="115,315 117,321 123,323 117,325 115,331 113,325 107,323 113,321" fill={secondaryColor} />
          <polygon points="695,235 697,240 702,242 697,244 695,249 693,244 688,242 693,240" fill="#f43f5e" />
        </g>
      </svg>
    </div>
  );
};
