import React, { useState } from 'react';
import { HomepageSection, SectionType } from '../../types/cms';
import {
  LayoutTemplate,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Columns,
  Image as ImageIcon,
  Type,
  HelpCircle,
  Mail,
  ShieldCheck,
  Star,
  Code,
  Tag,
  FolderTree,
} from 'lucide-react';

interface Props {
  sections: HomepageSection[];
  onSaveSections: (sections: HomepageSection[]) => void;
}

const SECTION_LIBRARY: {
  type: SectionType;
  name: string;
  description: string;
  defaultTitle: string;
  defaultSubtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'hero',
    name: 'Hero Cover Banner',
    description: 'Full-bleed high-impact story showcase with gradient overlay and action CTA',
    defaultTitle: 'The Modern Publishing Standard',
    defaultSubtitle: 'Where WordPress editorial ergonomics meets Astro performance and edge hosting.',
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
  },
  {
    type: 'featured-grid',
    name: 'Featured Stories Grid',
    description: 'Curated 2-3 column editorial card grid with tags and reading times',
    defaultTitle: 'Featured Stories & Architecture Guides',
    defaultSubtitle: 'Handpicked deep-dives into modern web development and publishing.',
    icon: <LayoutTemplate className="h-5 w-5 text-blue-500" />,
  },
  {
    type: 'latest-posts',
    name: 'Latest Dispatches List',
    description: 'Chronological post list with customizable column layout and category filters',
    defaultTitle: 'Latest Dispatches & Insights',
    defaultSubtitle: 'Fresh tutorials, architectural breakdowns, and editorial workflows.',
    icon: <Sliders className="h-5 w-5 text-emerald-500" />,
  },
  {
    type: 'category-showcase',
    name: 'Category & Topics Carousel',
    description: 'Visual topic pills and category cards with post count indicators',
    defaultTitle: 'Explore by Topic',
    defaultSubtitle: 'Browse articles categorized across our core engineering disciplines.',
    icon: <FolderTree className="h-5 w-5 text-purple-500" />,
  },
  {
    type: 'newsletter',
    name: 'Newsletter Email Capture',
    description: 'Conversion-optimized newsletter signup card for subscriber growth',
    defaultTitle: 'Stay Ahead of the Headless CMS Frontier',
    defaultSubtitle: 'Join 14,000+ engineers receiving our weekly curation of Astro and edge patterns.',
    icon: <Mail className="h-5 w-5 text-rose-500" />,
  },
  {
    type: 'faq',
    name: 'FAQ & Accordion (Schema.org)',
    description: 'Interactive expandable FAQ section that automatically outputs FAQPage JSON-LD schema',
    defaultTitle: 'Frequently Asked Questions',
    defaultSubtitle: 'Everything you need to know about AstroPress, Sveltia CMS, and Cloudflare Pages.',
    icon: <HelpCircle className="h-5 w-5 text-indigo-500" />,
  },
  {
    type: 'cta',
    name: 'Call-to-Action Banner',
    description: 'Highlighted promotional banner with title, description, and action button',
    defaultTitle: 'Ready to Deploy Your Own Headless CMS?',
    defaultSubtitle: 'Clone the repository and deploy to Cloudflare Pages in under 2 minutes.',
    icon: <ShieldCheck className="h-5 w-5 text-teal-500" />,
  },
  {
    type: 'testimonials',
    name: 'Reader & Editor Testimonials',
    description: 'Social proof quote cards from team editors, contributors, and readers',
    defaultTitle: 'Loved by Editorial Teams Worldwide',
    defaultSubtitle: 'See what publishers and engineers say about migrating from legacy platforms.',
    icon: <Star className="h-5 w-5 text-amber-500" />,
  },
  {
    type: 'brand-logos',
    name: 'Tech Stack & Partner Logos',
    description: 'Row of partner logos (Astro, Sveltia, Cloudflare, React, TypeScript)',
    defaultTitle: 'Powered by Modern Web Standards',
    defaultSubtitle: 'Built on top of the world’s most robust open-source edge technologies.',
    icon: <Columns className="h-5 w-5 text-slate-500" />,
  },
  {
    type: 'custom-html',
    name: 'Custom Markdown / HTML Widget',
    description: 'Freeform HTML or Markdown block for custom embeds, widgets, or notices',
    defaultTitle: 'Custom Information Block',
    defaultSubtitle: 'Render any custom markup directly into the homepage flow.',
    icon: <Code className="h-5 w-5 text-cyan-500" />,
  },
];

export const HomepageBuilder: React.FC<Props> = ({ sections, onSaveSections }) => {
  const [localSections, setLocalSections] = useState<HomepageSection[]>(sections);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(sections[0]?.id || null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localSections.length) return;
    const newSections = [...localSections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIdx, 0, moved);
    const updated = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSections(updated);
  };

  const toggleVisibility = (id: string) => {
    setLocalSections(
      localSections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateSection = (id: string, updates: Partial<HomepageSection>) => {
    setLocalSections(
      localSections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const duplicateSection = (index: number) => {
    const target = localSections[index];
    const newSection: HomepageSection = {
      ...target,
      id: 'sec-' + Date.now().toString(36),
      title: `${target.title} (Copy)`,
      order: index + 2,
    };
    const newSections = [...localSections];
    newSections.splice(index + 1, 0, newSection);
    const updated = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSections(updated);
    setExpandedSectionId(newSection.id);
  };

  const deleteSection = (id: string) => {
    if (localSections.length <= 1) {
      alert('You must keep at least one homepage section.');
      return;
    }
    const filtered = localSections.filter((s) => s.id !== id);
    const updated = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSections(updated);
  };

  const addSectionFromLibrary = (item: (typeof SECTION_LIBRARY)[0]) => {
    const newSection: HomepageSection = {
      id: 'sec-' + Date.now().toString(36),
      type: item.type,
      title: item.defaultTitle,
      subtitle: item.defaultSubtitle,
      enabled: true,
      order: localSections.length + 1,
      columns: item.type === 'category-showcase' ? 5 : item.type === 'featured-grid' ? 3 : 2,
      aspectRatio: '16:10',
      imageFit: 'cover',
      itemCount: 6,
      buttonText: 'Read More',
      buttonUrl: '/posts',
    };
    setLocalSections([...localSections, newSection]);
    setExpandedSectionId(newSection.id);
    setShowAddModal(false);
  };

  const handleSave = () => {
    onSaveSections(localSections);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
            <span>Extensible Homepage Builder</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {localSections.length} Sections
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add any section from the extensible library, customize layouts, filter articles, and reorder homepage flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 text-blue-400" />
            <span>Add Section</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Layout Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Homepage Layout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections List Stack */}
      <div className="space-y-4">
        {localSections.map((sec, index) => {
          const isExpanded = expandedSectionId === sec.id;
          return (
            <div
              key={sec.id}
              className={`rounded-2xl border transition-all ${
                sec.enabled
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
              }`}
            >
              {/* Section Header Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded shrink-0">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{sec.title || sec.type}</h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                        {sec.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 truncate block">{sec.subtitle || 'Configurable section'}</span>
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(sec.id)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                      sec.enabled
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                    title={sec.enabled ? 'Section Enabled' : 'Section Disabled'}
                  >
                    {sec.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, 'up')}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={index === localSections.length - 1}
                    onClick={() => moveSection(index, 'down')}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicateSection(index)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Duplicate Section"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSection(sec.id)}
                    className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {isExpanded ? 'Collapse' : 'Configure'}
                  </button>
                </div>
              </div>

              {/* Expanded Section Settings Panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/50 rounded-b-2xl animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Section Title</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Section Subtitle</label>
                      <input
                        type="text"
                        value={sec.subtitle || ''}
                        onChange={(e) => updateSection(sec.id, { subtitle: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Section-Specific Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Columns Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Columns Layout</label>
                      <select
                        value={sec.columns || 3}
                        onChange={(e) => updateSection(sec.id, { columns: Number(e.target.value) as any })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value={1}>1 Full Column</option>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Carousel Columns</option>
                      </select>
                    </div>

                    {/* Image Aspect Ratio */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Card Image Aspect Ratio</label>
                      <select
                        value={sec.aspectRatio || '16:10'}
                        onChange={(e) => updateSection(sec.id, { aspectRatio: e.target.value as any })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="16:9">16:9 Landscape</option>
                        <option value="16:10">16:10 Editorial</option>
                        <option value="4:3">4:3 Standard</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="original">Original Aspect</option>
                      </select>
                    </div>

                    {/* Post Filter Category */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Category Filter</label>
                      <input
                        type="text"
                        value={sec.categoryFilter || ''}
                        onChange={(e) => updateSection(sec.id, { categoryFilter: e.target.value })}
                        placeholder="All Categories"
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Button URL & Custom Content if CTA / Custom */}
                  {(sec.type === 'cta' || sec.type === 'custom-html') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Button Label</label>
                        <input
                          type="text"
                          value={sec.buttonText || ''}
                          onChange={(e) => updateSection(sec.id, { buttonText: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Button Target URL</label>
                        <input
                          type="text"
                          value={sec.buttonUrl || ''}
                          onChange={(e) => updateSection(sec.id, { buttonUrl: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Section Library Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-blue-600" />
                  <span>Homepage Section Library</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a section type to insert into your modular homepage layout.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
              {SECTION_LIBRARY.map((item) => (
                <div
                  key={item.type}
                  onClick={() => addSectionFromLibrary(item)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-white transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
