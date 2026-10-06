import React, { useState, useEffect } from 'react';
import { GutenbergBlock } from '../../types/cms';
import { getPersistedMediaBlob } from '../../data/mediaStorage';
import {
  Quote,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const BlockImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    if (src && (src.startsWith('/uploads/') || src.startsWith('uploads/'))) {
      getPersistedMediaBlob(src).then((blob) => {
        if (blob) setCurrentSrc(blob);
      }).catch(() => {});
    }
  }, [src]);

  return (
    <img
      src={currentSrc || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'}
      alt={alt}
      className={className}
      loading="lazy"
      onError={async () => {
        if (src) {
          const fallback = await getPersistedMediaBlob(src);
          if (fallback) setCurrentSrc(fallback);
        }
      }}
    />
  );
};

function parseMarkdownToBlocks(markdown: string): GutenbergBlock[] {
  if (!markdown) return [];
  const blocks: GutenbergBlock[] = [];
  const sections = markdown.split(/\n\n+/);
  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('# ')) {
      blocks.push({ id: `md-h1-${idx}`, type: 'heading', content: trimmed.replace(/^#\s+/, ''), settings: { level: 1 } });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id: `md-h2-${idx}`, type: 'heading', content: trimmed.replace(/^##\s+/, ''), settings: { level: 2 } });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id: `md-h3-${idx}`, type: 'heading', content: trimmed.replace(/^###\s+/, ''), settings: { level: 3 } });
    } else if (trimmed.startsWith('>')) {
      blocks.push({ id: `md-q-${idx}`, type: 'quote', content: trimmed.replace(/^>\s*/gm, '').trim(), settings: {} });
    } else if (trimmed.startsWith('```')) {
      const lines = trimmed.split('\n');
      const lang = lines[0].replace('```', '').trim() || 'typescript';
      const code = lines.slice(1, -1).join('\n');
      blocks.push({ id: `md-code-${idx}`, type: 'code', content: code, settings: { codeLanguage: lang } });
    } else {
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        blocks.push({
          id: `md-img-${idx}`,
          type: 'image',
          content: imgMatch[2],
          settings: { imageUrl: imgMatch[2], imageAlt: imgMatch[1] },
        });
      } else {
        blocks.push({ id: `md-p-${idx}`, type: 'paragraph', content: trimmed, settings: {} });
      }
    }
  });
  return blocks;
}

interface Props {
  blocks?: GutenbergBlock[];
  rawMarkdown?: string;
  previewMode?: boolean;
}

export const GutenbergBlockRenderer: React.FC<Props> = ({ blocks, rawMarkdown, previewMode = false }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const renderBlocks = (blocks && blocks.length > 0) ? blocks : (rawMarkdown ? parseMarkdownToBlocks(rawMarkdown) : []);

  if (!renderBlocks || renderBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 text-slate-800 leading-relaxed font-normal">
      {renderBlocks.map((block) => {
        const { id, type, content, settings = {} } = block;

        switch (type) {
          case 'heading': {
            const level = settings.level || 2;
            const alignClass =
              settings.align === 'center'
                ? 'text-center'
                : settings.align === 'right'
                ? 'text-right'
                : 'text-left';
            
            const commonHeadingClasses = `font-bold tracking-tight text-slate-900 ${alignClass} ${settings.customClasses || ''}`;
            const style = {
              color: settings.textColor,
            };

            if (level === 1) {
              return (
                <h1 key={id} style={style} className={`text-3xl md:text-4xl mt-8 mb-4 ${commonHeadingClasses}`}>
                  {content}
                </h1>
              );
            }
            if (level === 2) {
              return (
                <h2 key={id} style={style} className={`text-2xl md:text-3xl mt-8 mb-3 pb-2 border-b border-slate-200 ${commonHeadingClasses}`}>
                  {content}
                </h2>
              );
            }
            if (level === 3) {
              return (
                <h3 key={id} style={style} className={`text-xl md:text-2xl mt-6 mb-3 ${commonHeadingClasses}`}>
                  {content}
                </h3>
              );
            }
            return (
              <h4 key={id} style={style} className={`text-lg md:text-xl mt-4 mb-2 ${commonHeadingClasses}`}>
                {content}
              </h4>
            );
          }

          case 'paragraph': {
            const sizeClass =
              settings.fontSize === 'small'
                ? 'text-sm'
                : settings.fontSize === 'large'
                ? 'text-xl leading-relaxed'
                : settings.fontSize === 'huge'
                ? 'text-2xl leading-relaxed font-light'
                : 'text-base md:text-lg leading-relaxed';

            const alignClass =
              settings.align === 'center'
                ? 'text-center'
                : settings.align === 'right'
                ? 'text-right'
                : 'text-left';

            return (
              <p
                key={id}
                style={{
                  color: settings.textColor,
                  backgroundColor: settings.backgroundColor,
                  padding: settings.padding,
                }}
                className={`${sizeClass} ${alignClass} text-slate-700 font-normal ${settings.customClasses || ''}`}
              >
                {content}
              </p>
            );
          }

          case 'quote': {
            return (
              <figure
                key={id}
                style={{
                  backgroundColor: settings.backgroundColor || '#f8fafc',
                  borderLeftColor: settings.textColor || '#2563eb',
                }}
                className={`my-6 rounded-r-xl border-l-4 p-5 md:p-6 shadow-sm border-slate-200 bg-slate-50/80 ${settings.customClasses || ''}`}
              >
                <div className="flex gap-3">
                  <Quote className="h-6 w-6 text-blue-600 shrink-0 opacity-70" />
                  <div>
                    <blockquote className="text-lg md:text-xl italic font-serif-custom text-slate-800 leading-snug">
                      {content}
                    </blockquote>
                    {settings.imageCaption && (
                      <figcaption className="mt-3 text-xs uppercase tracking-wider font-semibold text-slate-500">
                        — {settings.imageCaption}
                      </figcaption>
                    )}
                  </div>
                </div>
              </figure>
            );
          }

          case 'code': {
            return (
              <div key={id} className="relative my-6 rounded-xl bg-slate-900 text-slate-100 p-4 md:p-5 font-mono-custom text-sm shadow-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">
                    {settings.codeLanguage || 'TypeScript'}
                  </span>
                  <button
                    onClick={() => handleCopyCode(id, content)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedCodeId === id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <code>{content}</code>
                </pre>
              </div>
            );
          }

          case 'image': {
            const imageUrl = settings.imageUrl || content;
            const captionText = (settings.imageCaption &&
              !settings.imageCaption.toLowerCase().includes('webp optimized') &&
              !settings.imageCaption.toLowerCase().includes('saved '))
              ? settings.imageCaption
              : undefined;

            return (
              <figure key={id} className="my-8 text-center">
                <div className="overflow-hidden rounded-xl bg-slate-100 shadow-sm border border-slate-200/60 max-w-4xl mx-auto">
                  <BlockImage
                    src={imageUrl}
                    alt={settings.imageAlt || 'Article illustration'}
                    className="w-full h-auto object-cover max-h-[550px] transition-transform duration-300 hover:scale-[1.01]"
                  />
                </div>
                {captionText && (
                  <figcaption className="mt-2.5 text-xs md:text-sm text-slate-500 italic">
                    {captionText}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'columns': {
            const cols = settings.columns || [
              { id: 'c1', content: 'Column 1 Content' },
              { id: 'c2', content: 'Column 2 Content' },
            ];
            const layout = settings.columnLayout || '50-50';

            const gridClass =
              layout === '33-33-33'
                ? 'grid-cols-1 md:grid-cols-3'
                : layout === '70-30'
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2';

            return (
              <div key={id} className={`grid ${gridClass} gap-6 my-6`}>
                {cols.map((col, idx) => {
                  const colSpan =
                    layout === '70-30' ? (idx === 0 ? 'md:col-span-2' : 'md:col-span-1') : '';
                  return (
                    <div
                      key={col.id || idx}
                      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs ${colSpan}`}
                    >
                      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
                        {col.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'alert': {
            const alertType = settings.alertType || 'info';
            const alertConfigs = {
              info: {
                bg: 'bg-blue-50/90 text-blue-900 border-blue-200',
                icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
                title: 'Note',
              },
              warning: {
                bg: 'bg-amber-50/90 text-amber-900 border-amber-200',
                icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
                title: 'Attention',
              },
              success: {
                bg: 'bg-emerald-50/90 text-emerald-900 border-emerald-200',
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
                title: 'Success',
              },
              danger: {
                bg: 'bg-rose-50/90 text-rose-900 border-rose-200',
                icon: <XCircle className="h-5 w-5 text-rose-600 shrink-0" />,
                title: 'Warning',
              },
            };
            const current = alertConfigs[alertType];

            return (
              <div
                key={id}
                className={`my-6 flex items-start gap-3.5 rounded-xl border p-4.5 shadow-2xs ${current.bg}`}
              >
                {current.icon}
                <div className="text-sm md:text-base font-normal leading-relaxed">
                  <span className="font-semibold block mb-0.5">{current.title}</span>
                  {content}
                </div>
              </div>
            );
          }

          case 'accordion': {
            const items = settings.accordionItems || [
              { title: 'Item 1 Question', content: 'Item 1 detailed explanation' },
            ];

            return (
              <div key={id} className="my-6 space-y-2.5">
                {items.map((item, idx) => {
                  const itemKey = `${id}-${idx}`;
                  const isOpen = !!openAccordions[itemKey];
                  return (
                    <div
                      key={itemKey}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(itemKey)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-base">{item.title}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-100 px-5 py-4 text-sm md:text-base text-slate-600 leading-relaxed bg-slate-50/50">
                          {item.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'button': {
            const btnStyle = settings.buttonStyle || 'primary';
            const url = settings.buttonUrl || '#';
            const isExternal = url.startsWith('http');

            const styleMap = {
              primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20',
              secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs',
              outline: 'border border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-600 bg-white',
            };

            return (
              <div
                key={id}
                className={`my-6 ${
                  settings.align === 'center'
                    ? 'text-center'
                    : settings.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                <a
                  href={url}
                  target={isExternal ? '_blank' : '_self'}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all ${styleMap[btnStyle]}`}
                >
                  <span>{content || 'Explore More'}</span>
                  {isExternal ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </a>
              </div>
            );
          }

          case 'author-box': {
            return (
              <div
                key={id}
                className="my-8 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Author Avatar"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-slate-900 text-lg">
                      {content || 'Amit Singh'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                      Author & Lead Architect
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Software engineer and publishing architect specializing in Astro, headless CMS patterns, and edge deployment infrastructures.
                  </p>
                </div>
              </div>
            );
          }

          case 'divider': {
            return <hr key={id} className="my-8 border-slate-200" />;
          }

          case 'spacer': {
            return <div key={id} className="h-8 md:h-12" aria-hidden="true" />;
          }

          default:
            return (
              <div key={id} className="my-4 text-slate-700 text-base leading-relaxed">
                {content}
              </div>
            );
        }
      })}
    </div>
  );
};
