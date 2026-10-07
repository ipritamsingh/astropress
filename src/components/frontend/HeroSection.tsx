import React from 'react';
import { HeroSectionConfig } from '../../types/cms';
import { HeroIllustrationSvg } from '../common/HeroIllustrationSvg';
import {
  Sparkles,
  Zap,
  Rocket,
  Code2,
  Star,
  Shield,
  ArrowRight,
  GitBranch,
  Cpu,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  config: HeroSectionConfig;
  onNavigate?: (path: string) => void;
  isCustomizerPreview?: boolean;
}

export const HeroSection: React.FC<Props> = ({
  config,
  onNavigate,
  isCustomizerPreview = false,
}) => {
  if (!config.enabled && !isCustomizerPreview) {
    return null;
  }

  const renderEyebrowIcon = () => {
    switch (config.eyebrowIcon) {
      case 'sparkles':
        return <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />;
      case 'zap':
        return <Zap className="h-3.5 w-3.5 text-amber-500" />;
      case 'rocket':
        return <Rocket className="h-3.5 w-3.5 text-rose-500" />;
      case 'code':
        return <Code2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'star':
        return <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />;
      default:
        return null;
    }
  };

  const renderTrustBadgeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'star':
        return <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />;
      case 'shield':
        return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      case 'zap':
        return <Zap className="h-3.5 w-3.5 text-amber-500" />;
      case 'git':
        return <GitBranch className="h-3.5 w-3.5 text-indigo-500" />;
      case 'cpu':
        return <Cpu className="h-3.5 w-3.5 text-cyan-500" />;
      case 'users':
        return <Users className="h-3.5 w-3.5 text-purple-500" />;
      case 'check':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  // Process heading and highlight phrases
  const renderHeading = () => {
    const { heading, headingHighlight, headingHighlightType, headingHighlightColor } = config;
    if (!headingHighlight || !heading.toLowerCase().includes(headingHighlight.toLowerCase())) {
      return <span>{heading}</span>;
    }

    const regex = new RegExp(`(${escapeRegex(headingHighlight)})`, 'gi');
    const parts = heading.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          if (part.toLowerCase() === headingHighlight.toLowerCase()) {
            if (headingHighlightType === 'gradient') {
              return (
                <span
                  key={index}
                  className={`bg-gradient-to-r ${headingHighlightColor || 'from-blue-600 via-indigo-600 to-cyan-500'} bg-clip-text text-transparent`}
                >
                  {part}
                </span>
              );
            }
            if (headingHighlightType === 'underline') {
              return (
                <span
                  key={index}
                  className="underline decoration-blue-500 decoration-wavy underline-offset-8 text-blue-600"
                >
                  {part}
                </span>
              );
            }
            if (headingHighlightType === 'badge') {
              return (
                <span
                  key={index}
                  className="inline-block px-3 py-1 mx-1 rounded-xl bg-blue-600 text-white shadow-md text-[0.85em]"
                >
                  {part}
                </span>
              );
            }
            // Solid color
            return (
              <span key={index} style={{ color: config.svgAccentColor || '#2563eb' }}>
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  // Layout & Container Styling
  const getContainerWidth = () => {
    switch (config.containerWidth) {
      case 'narrow':
        return 'max-w-4xl mx-auto';
      case 'wide':
        return 'max-w-7xl mx-auto';
      case 'full':
        return 'w-full';
      default:
        return 'max-w-6xl mx-auto';
    }
  };

  const getPaddingY = () => {
    switch (config.paddingY) {
      case 'compact':
        return 'py-8 sm:py-12';
      case 'spacious':
        return 'py-16 sm:py-24';
      case 'luxurious':
        return 'py-20 sm:py-32';
      default:
        return 'py-12 sm:py-16';
    }
  };

  const getRadiusClass = () => {
    switch (config.borderRadius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-lg';
      case 'md':
        return 'rounded-xl';
      case 'lg':
        return 'rounded-2xl';
      case '3xl':
        return 'rounded-3xl';
      default:
        return 'rounded-2xl';
    }
  };

  const getShadowClass = () => {
    switch (config.shadow) {
      case 'none':
        return '';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-xl';
      case '2xl':
        return 'shadow-2xl';
      default:
        return 'shadow-sm';
    }
  };

  const getHeadingSize = () => {
    switch (config.headingSize) {
      case 'sm':
        return 'text-2xl sm:text-3xl';
      case 'lg':
        return 'text-3xl sm:text-4xl lg:text-5xl';
      case '2xl':
        return 'text-4xl sm:text-5xl lg:text-6xl';
      case '4xl':
        return 'text-5xl sm:text-6xl lg:text-7xl';
      default:
        return 'text-3xl sm:text-4xl md:text-5xl';
    }
  };

  const getAlignment = () => {
    switch (config.alignment) {
      case 'center':
        return 'text-center items-center';
      case 'right':
        return 'text-right items-end';
      default:
        return 'text-left items-start';
    }
  };

  const handleButtonClick = (url: string) => {
    let target = url;
    if (
      (config.secondaryButtonText === 'Launch Admin Studio' &&
        (target === '/admin' || target === '/admin/' || target === '/dashboard' || target === '/dashboard/')) ||
      !target
    ) {
      target = '/wpadmin/';
    }
    if (onNavigate && target.startsWith('/')) {
      onNavigate(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  return (
    <section className={`relative transition-all duration-300 ${getPaddingY()}`}>
      <div
        style={{
          backgroundColor:
            config.backgroundType === 'solid'
              ? config.backgroundColor
              : config.backgroundType === 'dark-slate'
              ? '#090d16'
              : undefined,
          background:
            config.backgroundType === 'gradient-subtle'
              ? `linear-gradient(135deg, ${config.gradientFrom || '#eff6ff'} 0%, ${config.gradientTo || '#f8fafc'} 100%)`
              : config.backgroundType === 'gradient-mesh'
              ? `radial-gradient(at 0% 0%, ${config.gradientFrom || '#eff6ff'} 0px, transparent 50%), radial-gradient(at 100% 100%, ${config.svgAccentColor}18 0px, transparent 50%)`
              : undefined,
        }}
        className={`relative overflow-hidden border border-slate-200/80 ${getRadiusClass()} ${getShadowClass()} ${getContainerWidth()} p-6 sm:p-10 md:p-12 lg:p-14`}
      >
        {/* Subtle decorative grid overlay if configured */}
        {config.backgroundType === 'grid-pattern' && (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        )}

        <div
          className={`grid gap-8 lg:gap-12 items-center ${
            config.showIllustration
              ? config.illustrationPosition === 'bottom'
                ? 'grid-cols-1'
                : 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1'
          }`}
        >
          {/* Text Content Column */}
          <div
            className={`space-y-6 flex flex-col ${getAlignment()} ${
              config.showIllustration && config.illustrationPosition !== 'bottom'
                ? config.illustrationPosition === 'left'
                  ? 'lg:col-span-6 lg:order-2'
                  : 'lg:col-span-7 lg:order-1'
                : 'w-full'
            }`}
          >
            {/* Eyebrow Label */}
            {config.showEyebrow && config.eyebrowText && (
              <div
                style={{
                  backgroundColor: config.eyebrowBgColor || 'rgba(37, 99, 235, 0.08)',
                  color: config.eyebrowTextColor || '#2563eb',
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight border border-blue-200/50 shadow-2xs"
              >
                {renderEyebrowIcon()}
                <span>{config.eyebrowText}</span>
              </div>
            )}

            {/* Main Heading */}
            <h1
              style={{
                color: config.backgroundType === 'dark-slate' ? '#ffffff' : config.textColor || '#0f172a',
              }}
              className={`${getHeadingSize()} font-extrabold tracking-tight leading-[1.12] text-balance`}
            >
              {renderHeading()}
            </h1>

            {/* Supporting Description */}
            {config.showDescription && config.description && (
              <p
                style={{
                  color:
                    config.backgroundType === 'dark-slate'
                      ? '#cbd5e1'
                      : config.descriptionColor || '#475569',
                }}
                className="text-base sm:text-lg leading-relaxed max-w-2xl text-pretty font-normal"
              >
                {config.description}
              </p>
            )}

            {/* Action Buttons */}
            {(config.showPrimaryButton || config.showSecondaryButton) && (
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                {config.showPrimaryButton && config.primaryButtonText && (
                  <button
                    onClick={() => handleButtonClick(config.primaryButtonUrl || '/posts')}
                    style={{
                      backgroundColor: config.primaryButtonBgColor || config.svgAccentColor || '#2563eb',
                      color: config.primaryButtonTextColor || '#ffffff',
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 hover:shadow-lg transition-all active:scale-98"
                  >
                    <span>{config.primaryButtonText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {/* Modular Admin Launch Button (Can be removed or toggled via config.showSecondaryButton) */}
                {config.showSecondaryButton && config.secondaryButtonText && (
                  <button
                    onClick={() => handleButtonClick(config.secondaryButtonUrl || '/wpadmin/')}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
                      config.backgroundType === 'dark-slate'
                        ? 'border border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700'
                        : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <span>{config.secondaryButtonText}</span>
                  </button>
                )}
              </div>
            )}

            {/* Trust Proof Badges (Adjacency to CTA) */}
            {config.showTrustBadges && config.trustBadges && config.trustBadges.length > 0 && (
              <div className="pt-4 border-t border-slate-200/60 w-full">
                {config.trustBadgesTitle && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {config.trustBadgesTitle}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                  {config.trustBadges.map((badge, idx) => (
                    <div key={badge.id || idx} className="flex items-center gap-1.5">
                      {renderTrustBadgeIcon(badge.iconName)}
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SVG Hero Illustration Column */}
          {config.showIllustration && (
            <div
              className={`${
                config.hideIllustrationOnMobile ? 'hidden sm:block' : 'block'
              } ${
                config.illustrationPosition === 'bottom'
                  ? 'w-full'
                  : config.illustrationPosition === 'left'
                  ? 'lg:col-span-6 lg:order-1'
                  : 'lg:col-span-5 lg:order-2'
              } flex justify-center items-center`}
            >
              <div className="w-full max-w-lg lg:max-w-none transform transition-transform hover:scale-[1.01] duration-500">
                <HeroIllustrationSvg
                  accentColor={config.svgAccentColor || '#2563eb'}
                  secondaryColor={config.svgSecondaryColor || '#06b6d4'}
                  illustrationType={config.illustrationType}
                  customSvgContent={config.customSvgContent}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
