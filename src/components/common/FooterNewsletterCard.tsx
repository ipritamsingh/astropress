import React, { useState } from 'react';
import { FooterConfig, FooterNewsletterStyle, SiteSettings } from '../../types/cms';
import { initialNewsletterStyle } from '../../data/initialData';
import { Mail, Send, Check, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  footerConfig: FooterConfig;
  siteSettings?: SiteSettings;
  isPreview?: boolean;
  onSubscribe?: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  className?: string;
}

export const FooterNewsletterCard: React.FC<Props> = ({
  footerConfig,
  siteSettings,
  isPreview = false,
  onSubscribe,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const newsletterConf = siteSettings?.newsletterSettings;
  const styleConf: FooterNewsletterStyle = {
    ...initialNewsletterStyle,
    ...(footerConfig.newsletterStyle || {}),
  };

  // Resolved Content values
  const title =
    footerConfig.newsletterTitle ||
    newsletterConf?.title ||
    'THE HEADLESS DISPATCH';

  const subtitle =
    footerConfig.newsletterSubtitle ||
    newsletterConf?.subtitle ||
    'Get the latest articles, tutorials and updates directly in your inbox.';

  const placeholder =
    footerConfig.newsletterPlaceholder ||
    newsletterConf?.placeholderText ||
    'Enter your email address';

  const buttonText =
    footerConfig.newsletterButtonText ||
    newsletterConf?.buttonText ||
    'Subscribe';

  const disclaimer =
    footerConfig.newsletterDisclaimer ??
    'No spam. Unsubscribe at any time.';

  const successMsg =
    footerConfig.newsletterSuccessMsg ||
    newsletterConf?.successMessage ||
    'Thank you for subscribing to The Headless Dispatch!';

  // Resolved Colors with safe defaults
  const cardBgStart = styleConf.cardBgStart || '#1E3A8A';
  const cardBgEnd = styleConf.cardBgEnd || '#0B1220';
  const inputBg = styleConf.inputBg || '#111827';
  const inputBorder = styleConf.inputBorder || '#1F2937';
  const inputTextColor = styleConf.inputTextColor || '#F9FAFB';
  const placeholderColor = styleConf.placeholderColor || '#94A3B8';
  const buttonBg = styleConf.buttonBg || '#2563EB';
  const buttonTextColor = styleConf.buttonTextColor || '#FFFFFF';
  const headingColor = styleConf.headingColor || '#F9FAFB';
  const descriptionColor = styleConf.descriptionColor || '#94A3B8';
  const privacyTextColor = styleConf.privacyTextColor || '#94A3B8';

  // Resolved Layout & Typography mappings
  const cardPaddingClass =
    styleConf.cardPadding === 'compact'
      ? 'p-4'
      : styleConf.cardPadding === 'spacious'
      ? 'p-6 sm:p-7'
      : 'p-5 sm:p-6';

  const borderRadiusMap: Record<string, string> = {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
  };
  const cardBorderRadiusValue = borderRadiusMap[styleConf.cardBorderRadius || '2xl'] || '1.25rem';

  const inputRadiusMap: Record<string, string> = {
    none: '0px',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.625rem',
    '2xl': '0.75rem',
    '3xl': '0.875rem',
  };
  const innerRadiusValue = inputRadiusMap[styleConf.cardBorderRadius || '2xl'] || '0.75rem';

  const inputHeightClass =
    styleConf.inputHeight === 'comfortable'
      ? 'py-2.5 px-3.5 text-sm min-h-[42px]'
      : styleConf.inputHeight === 'normal'
      ? 'py-2 px-3 text-xs min-h-[38px]'
      : 'py-1.5 px-3 text-xs min-h-[36px]';

  const buttonHeightClass =
    styleConf.buttonHeight === 'comfortable'
      ? 'py-2.5 min-h-[42px]'
      : styleConf.buttonHeight === 'normal'
      ? 'py-2 min-h-[38px]'
      : 'py-1.5 min-h-[36px]';

  const buttonPaddingXClass =
    styleConf.buttonPaddingX === 'compact'
      ? 'px-3.5'
      : styleConf.buttonPaddingX === 'spacious'
      ? 'px-6'
      : 'px-4 sm:px-5';

  const gapClass =
    styleConf.gap === 'xs'
      ? 'gap-1.5'
      : styleConf.gap === 'md'
      ? 'gap-3'
      : styleConf.gap === 'lg'
      ? 'gap-4'
      : 'gap-2';

  const maxWidthClass =
    styleConf.maxWidth === 'sm'
      ? 'max-w-sm'
      : styleConf.maxWidth === 'md'
      ? 'max-w-md'
      : styleConf.maxWidth === 'lg'
      ? 'max-w-lg'
      : styleConf.maxWidth === 'xl'
      ? 'max-w-xl'
      : 'max-w-full';

  const headingSizeClass =
    styleConf.headingFontSize === 'xs'
      ? 'text-[11px]'
      : styleConf.headingFontSize === 'base'
      ? 'text-sm sm:text-base'
      : styleConf.headingFontSize === 'lg'
      ? 'text-base sm:text-lg'
      : styleConf.headingFontSize === 'xl'
      ? 'text-lg sm:text-xl'
      : 'text-xs sm:text-sm';

  const headingWeightClass =
    styleConf.headingFontWeight === 'normal'
      ? 'font-normal'
      : styleConf.headingFontWeight === 'medium'
      ? 'font-medium'
      : styleConf.headingFontWeight === 'semibold'
      ? 'font-semibold'
      : styleConf.headingFontWeight === 'bold'
      ? 'font-bold'
      : 'font-extrabold';

  const descriptionSizeClass =
    styleConf.descriptionFontSize === 'base'
      ? 'text-sm'
      : styleConf.descriptionFontSize === 'xs'
      ? 'text-[11px]'
      : 'text-xs';

  const buttonFontSizeClass =
    styleConf.buttonFontSize === 'base'
      ? 'text-sm'
      : styleConf.buttonFontSize === 'sm'
      ? 'text-xs'
      : 'text-xs';

  const iconContainerSizeClass =
    styleConf.iconSize === 'sm'
      ? 'w-6 h-6 rounded-md'
      : styleConf.iconSize === 'lg'
      ? 'w-9 h-9 rounded-xl'
      : 'w-7.5 h-7.5 rounded-lg';

  const iconSvgSizeClass =
    styleConf.iconSize === 'sm'
      ? 'w-3 h-3'
      : styleConf.iconSize === 'lg'
      ? 'w-4.5 h-4.5'
      : 'w-3.5 h-3.5';

  const showIcon = styleConf.showIcon !== false;
  const isRowLayout = styleConf.desktopLayout !== 'column';
  const shouldStackOnMobile = styleConf.stackOnMobile !== false;

  const layoutFlexClass = isRowLayout
    ? shouldStackOnMobile
      ? 'flex flex-col sm:flex-row'
      : 'flex flex-row'
    : 'flex flex-col';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isPreview) {
      setIsSubscribed(true);
      setStatusMessage(successMsg);
      setTimeout(() => {
        setIsSubscribed(false);
        setStatusMessage('');
      }, 3500);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubscribe) {
        const res = await onSubscribe(trimmedEmail);
        if (res.success) {
          setIsSubscribed(true);
          setStatusMessage(res.message || successMsg);
          setEmail('');
        } else {
          setErrorMessage(res.error || 'Subscription failed. Please try again.');
        }
      } else {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsSubscribed(true);
          setStatusMessage(data.message || successMsg);
          setEmail('');
        } else {
          setErrorMessage(data.error || 'Subscription failed. Please try again.');
        }
      }
    } catch {
      setIsSubscribed(true);
      setStatusMessage(successMsg);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${cardBgStart} 0%, ${cardBgEnd} 100%)`,
        borderRadius: cardBorderRadiusValue,
      }}
      className={`relative overflow-hidden border border-blue-500/25 shadow-xl shadow-blue-950/40 text-white ${cardPaddingClass} ${maxWidthClass} ${className}`}
    >
      {/* Decorative Subtle Background Orbs & Micro Highlights */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue-400/12 blur-2xl pointer-events-none select-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-indigo-500/10 blur-xl pointer-events-none select-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Card Content Wrapper */}
      <div className="relative z-10 space-y-3.5">
        {/* Header: Compact Mail Icon Container + Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {showIcon && (
              <div
                className={`${iconContainerSizeClass} bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0 shadow-2xs`}
                aria-hidden="true"
              >
                <Mail className={iconSvgSizeClass} />
              </div>
            )}
            <h3
              style={{ color: headingColor }}
              className={`${headingSizeClass} ${headingWeightClass} tracking-wider uppercase leading-snug`}
            >
              {title}
            </h3>
          </div>

          <p
            style={{ color: descriptionColor }}
            className={`${descriptionSizeClass} leading-relaxed`}
          >
            {subtitle}
          </p>
        </div>

        {/* Subscription Form / Feedback State */}
        {isSubscribed ? (
          <div
            style={{ borderRadius: innerRadiusValue }}
            className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 text-xs font-medium animate-fadeIn"
          >
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusMessage || successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className={`${layoutFlexClass} ${gapClass} items-stretch`}>
              <div className="relative flex-1 min-w-0">
                <input
                  type="email"
                  required
                  aria-label="Email address for newsletter"
                  placeholder={placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: inputTextColor,
                    borderRadius: innerRadiusValue,
                  }}
                  className={`w-full ${inputHeightClass} border text-xs placeholder:text-[11px] sm:placeholder:text-xs outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400 transition-all disabled:opacity-50`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-label={buttonText}
                style={{
                  backgroundColor: buttonBg,
                  color: buttonTextColor,
                  borderRadius: innerRadiusValue,
                }}
                className={`inline-flex items-center justify-center gap-2 ${buttonPaddingXClass} ${buttonHeightClass} ${buttonFontSizeClass} font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-50 select-none`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>{buttonText}</span>
                    <Send className="h-3.5 w-3.5 shrink-0" />
                  </>
                )}
              </button>
            </div>

            {/* Privacy Disclaimer */}
            {disclaimer && (
              <p
                style={{ color: privacyTextColor }}
                className="text-[11px] leading-tight select-none pt-0.5"
              >
                {disclaimer}
              </p>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 pt-0.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
