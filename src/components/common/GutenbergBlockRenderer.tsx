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

export function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Handles standard markdown formatting: bold, italic, code, links, and line breaks
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|`.*?`|\*.*?\*|_.*?_|\n)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part === '\n') {
      return <br key={index} />;
    }

    // Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[0.88em] border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) ||
      (part.startsWith('_') && part.endsWith('_') && part.length > 2 && !part.startsWith('__'))
    ) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const isExt = linkMatch[2].startsWith('http');
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target={isExt ? '_blank' : undefined}
          rel={isExt ? 'noopener noreferrer' : undefined}
          className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

export function parseMarkdownToBlocks(markdown: string): GutenbergBlock[] {
  if (!markdown) return [];
  const blocks: GutenbergBlock[] = [];
  const sections = markdown.split(/\n\n+/);
  let i = 0;

  while (i < sections.length) {
    const sec = sections[i].trim();
    if (!sec) {
      i++;
      continue;
    }

    // 1. Divider Block: --- or *** or ___
    if (sec === '---' || sec === '***' || sec === '___') {
      blocks.push({
        id: `md-div-${blocks.length}`,
        type: 'divider',
        content: '',
        settings: {},
      });
      i++;
      continue;
    }

    // 2. Alert / Notice Block:
    // e.g. > **Notice**: Helpful contextual notice for your readers.
    // or > **Warning**: ... or > [!NOTE] ... or **Notice**: ...
    const alertMatch =
      sec.match(/^(?:>\s*)?\*\*(Notice|Note|Warning|Alert|Attention|Success|Danger)\*\*:\s*([\s\S]*)$/i) ||
      sec.match(/^(?:>\s*)?\[!(NOTE|WARNING|INFO|TIP|CAUTION)\]\s*([\s\S]*)$/i);
    if (alertMatch) {
      const alertWord = alertMatch[1].toLowerCase();
      const alertType =
        alertWord === 'warning' || alertWord === 'attention' || alertWord === 'caution'
          ? 'warning'
          : alertWord === 'success'
          ? 'success'
          : alertWord === 'danger'
          ? 'danger'
          : 'info';
      const cleanContent = alertMatch[2].replace(/^>\s*/gm, '').trim();
      blocks.push({
        id: `md-alert-${blocks.length}`,
        type: 'alert',
        content: cleanContent,
        settings: { alertType },
      });
      i++;
      continue;
    }

    // 3. Author Box:
    // e.g. **Author:** Amit Singh or **Author**: Amit Singh or Author: Amit Singh
    const authorMatch =
      sec.match(/^\*\*(?:Author|Written By):?\*\*:?\s*(.+)$/i) ||
      sec.match(/^(?:Author|Written By):\s*(.+)$/i);
    if (authorMatch) {
      blocks.push({
        id: `md-author-${blocks.length}`,
        type: 'author-box',
        content: authorMatch[1].trim(),
        settings: {},
      });
      i++;
      continue;
    }

    // 4. Button / Link Block:
    // Standalone link: [Read Full Documentation](#)
    const btnMatch = sec.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (btnMatch) {
      blocks.push({
        id: `md-btn-${blocks.length}`,
        type: 'button',
        content: btnMatch[1].trim(),
        settings: {
          buttonUrl: btnMatch[2].trim(),
          buttonStyle: 'primary',
          align: 'left',
        },
      });
      i++;
      continue;
    }

    // 5. Code Block: ```lang\ncode\n```
    if (sec.startsWith('```')) {
      const lines = sec.split('\n');
      const lang = lines[0].replace('```', '').trim() || 'typescript';
      const code = lines.slice(1, -1).join('\n');
      blocks.push({
        id: `md-code-${blocks.length}`,
        type: 'code',
        content: code,
        settings: { codeLanguage: lang },
      });
      i++;
      continue;
    }

    // 6. Image Block: ![alt](url)
    const imgMatch = sec.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({
        id: `md-img-${blocks.length}`,
        type: 'image',
        content: imgMatch[2].trim(),
        settings: {
          imageUrl: imgMatch[2].trim(),
          imageAlt: imgMatch[1].trim(),
        },
      });
      i++;
      continue;
    }

    // 7. Multi-column Block:
    // Section 1: Left Column Content: ...
    // Section 2: Right Column Content: ...
    // Or single section containing both Left Column and Right Column
    const isCol1 = /^(\*\*|\b)?(Left Column|Column 1)(\s+Content)?(\*\*|:|\b)/i.test(sec);
    const nextSec = i + 1 < sections.length ? sections[i + 1].trim() : '';
    const isCol2 = /^(\*\*|\b)?(Right Column|Column 2)(\s+Content)?(\*\*|:|\b)/i.test(nextSec);
    if (isCol1 && isCol2) {
      blocks.push({
        id: `md-cols-${blocks.length}`,
        type: 'columns',
        content: '',
        settings: {
          columnLayout: '50-50',
          columns: [
            { id: 'c1', content: sec },
            { id: 'c2', content: nextSec },
          ],
        },
      });
      i += 2;
      continue;
    }
    if (/Left Column/i.test(sec) && /Right Column/i.test(sec)) {
      const parts = sec.split(/(?=Right Column)/i);
      if (parts.length === 2) {
        blocks.push({
          id: `md-cols-${blocks.length}`,
          type: 'columns',
          content: '',
          settings: {
            columnLayout: '50-50',
            columns: [
              { id: 'c1', content: parts[0].trim() },
              { id: 'c2', content: parts[1].trim() },
            ],
          },
        });
        i++;
        continue;
      }
    }

    // 8. FAQ / Accordion Block:
    // Serialized as ### Question\nAnswer
    const faqMatch = sec.match(/^###\s+([^\n]+)\n([\s\S]+)$/);
    if (faqMatch) {
      const title = faqMatch[1].trim();
      const content = faqMatch[2].trim();
      const isQuestion = title.endsWith('?') || /^(Question|\d+\.|\bFAQ\b)/i.test(title);
      const nextIsFaq = i + 1 < sections.length && /^###\s+[^\n]+\n[\s\S]+$/.test(sections[i + 1].trim());

      if (isQuestion || nextIsFaq) {
        const accordionItems = [{ title, content }];
        i++;
        while (i < sections.length) {
          const s = sections[i].trim();
          const nextMatch = s.match(/^###\s+([^\n]+)\n([\s\S]+)$/);
          if (nextMatch) {
            accordionItems.push({
              title: nextMatch[1].trim(),
              content: nextMatch[2].trim(),
            });
            i++;
          } else {
            break;
          }
        }
        blocks.push({
          id: `md-acc-${blocks.length}`,
          type: 'accordion',
          content: 'Frequently Asked Questions',
          settings: { accordionItems },
        });
        continue;
      }
    }

    // 9. Quote Block: > quote text with optional — Author caption
    if (sec.startsWith('>')) {
      let quoteBody = sec.replace(/^>\s*/gm, '').trim();
      let caption = '';
      const captionMatch = quoteBody.match(/\n+—\s*(.+)$/);
      if (captionMatch) {
        caption = captionMatch[1].trim();
        quoteBody = quoteBody.replace(/\n+—\s*(.+)$/, '').trim();
      }
      blocks.push({
        id: `md-q-${blocks.length}`,
        type: 'quote',
        content: quoteBody,
        settings: { imageCaption: caption || undefined },
      });
      i++;
      continue;
    }

    // 10. Headings:
    if (sec.startsWith('# ')) {
      blocks.push({
        id: `md-h1-${blocks.length}`,
        type: 'heading',
        content: sec.replace(/^#\s+/, ''),
        settings: { level: 1 },
      });
      i++;
      continue;
    }
    if (sec.startsWith('## ')) {
      blocks.push({
        id: `md-h2-${blocks.length}`,
        type: 'heading',
        content: sec.replace(/^##\s+/, ''),
        settings: { level: 2 },
      });
      i++;
      continue;
    }
    if (sec.startsWith('### ')) {
      blocks.push({
        id: `md-h3-${blocks.length}`,
        type: 'heading',
        content: sec.replace(/^###\s+/, ''),
        settings: { level: 3 },
      });
      i++;
      continue;
    }
    if (sec.startsWith('#### ')) {
      blocks.push({
        id: `md-h4-${blocks.length}`,
        type: 'heading',
        content: sec.replace(/^####\s+/, ''),
        settings: { level: 4 },
      });
      i++;
      continue;
    }

    // 11. Lists:
    const listLines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
    const isAllList = listLines.every((l) => /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l));
    if (isAllList && listLines.length > 0) {
      blocks.push({
        id: `md-list-${blocks.length}`,
        type: 'list',
        content: sec,
        settings: {},
      });
      i++;
      continue;
    }

    // 12. Standard Paragraph:
    blocks.push({
      id: `md-p-${blocks.length}`,
      type: 'paragraph',
      content: sec,
      settings: {},
    });
    i++;
  }

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
                {renderInlineMarkdown(content)}
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
                      {renderInlineMarkdown(content)}
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
                        {renderInlineMarkdown(col.content)}
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
            const current = alertConfigs[alertType] || alertConfigs.info;

            return (
              <div
                key={id}
                className={`my-6 flex items-start gap-3.5 rounded-xl border p-4.5 shadow-2xs ${current.bg}`}
              >
                {current.icon}
                <div className="text-sm md:text-base font-normal leading-relaxed">
                  <span className="font-semibold block mb-0.5">{current.title}</span>
                  {renderInlineMarkdown(content)}
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
                          {renderInlineMarkdown(item.content)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'list': {
            const rawLines = (content || '').split('\n').map((l) => l.trim()).filter(Boolean);
            const isOrdered = rawLines.length > 0 && /^\d+\.\s+/.test(rawLines[0]);
            const listLines = rawLines.map((l) => l.replace(/^[-*]\s+|\d+\.\s+/, ''));

            if (isOrdered) {
              return (
                <ol key={id} className="list-decimal pl-6 my-4 space-y-1.5 text-slate-700 text-base md:text-lg">
                  {listLines.map((item, idx) => (
                    <li key={idx}>{renderInlineMarkdown(item)}</li>
                  ))}
                </ol>
              );
            }

            return (
              <ul key={id} className="list-disc pl-6 my-4 space-y-1.5 text-slate-700 text-base md:text-lg">
                {listLines.map((item, idx) => (
                  <li key={idx}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
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
                {renderInlineMarkdown(content)}
              </div>
            );
        }
      })}
    </div>
  );
};
