import React, { useState } from 'react';
import { TemplateConfig } from '../../types/cms';
import {
  LayoutTemplate,
  Save,
  CheckCircle2,
  Sliders,
  Eye,
  FileText,
  FolderTree,
  Tag,
  User,
  Search,
  AlertTriangle,
  Code,
  Sparkles,
} from 'lucide-react';

interface Props {
  templates: TemplateConfig[];
  onSaveTemplates: (templates: TemplateConfig[]) => void;
}

export const TemplateBuilder: React.FC<Props> = ({ templates, onSaveTemplates }) => {
  const [templateList, setTemplateList] = useState<TemplateConfig[]>(templates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl-single-post');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedTemplate = templateList.find((t) => t.id === selectedTemplateId) || templateList[0];

  const updateSelectedTemplate = (updates: Partial<TemplateConfig>) => {
    const updated = templateList.map((t) =>
      t.id === selectedTemplate.id ? { ...t, ...updates } : t
    );
    setTemplateList(updated);
  };

  const handleSave = () => {
    onSaveTemplates(templateList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getTemplateIcon = (slug: string) => {
    switch (slug) {
      case 'single-post':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'static-page':
        return <LayoutTemplate className="h-4 w-4 text-emerald-600" />;
      case 'category-archive':
        return <FolderTree className="h-4 w-4 text-amber-600" />;
      case 'tag-archive':
        return <Tag className="h-4 w-4 text-purple-600" />;
      case 'author-archive':
        return <User className="h-4 w-4 text-teal-600" />;
      case 'search-results':
        return <Search className="h-4 w-4 text-indigo-600" />;
      case '404':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
            <span>Site Templates & Layout Builder</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure site-wide templates for single posts, pages, category & tag archives, author bios, search, and 404.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Templates Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save All Template Configurations</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Template Selector Sidebar + Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List Selector */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Site Templates ({templateList.length})
          </span>
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs space-y-1">
            {templateList.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-left text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : ''}>{getTemplateIcon(tpl.slug)}</span>
                  <span className="truncate">{tpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Template Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTemplate && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
              {/* Template Title Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    {getTemplateIcon(selectedTemplate.slug)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedTemplate.name}</h2>
                    <span className="text-xs text-slate-400 font-mono">
                      Template Key: <code className="text-blue-600">{selectedTemplate.slug}</code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Template Layout Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Page Layout Structure
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'standard', name: 'Standard (Content Centered)' },
                    { id: 'full-width', name: 'Full Width (No Margins)' },
                    { id: 'sidebar-right', name: 'Sidebar Right' },
                    { id: 'minimal', name: 'Minimal Editorial' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => updateSelectedTemplate({ layout: l.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        selectedTemplate.layout === l.id
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Image & Media Display */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Featured Image Display
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Show Featured Image</span>
                      <span className="text-[10px] text-slate-500">Display cover image banner</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTemplate.showFeaturedImage}
                      onChange={(e) => updateSelectedTemplate({ showFeaturedImage: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1">Image Aspect Ratio</span>
                    <select
                      value={selectedTemplate.imageAspectRatio}
                      onChange={(e) => updateSelectedTemplate({ imageAspectRatio: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="16:9">16:9 Cinematic Landscape</option>
                      <option value="16:10">16:10 Editorial Magazine</option>
                      <option value="4:3">4:3 Classic Standard</option>
                      <option value="1:1">1:1 Square</option>
                      <option value="original">Original Aspect Ratio</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Editorial Metadata Toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Editorial Elements & Widgets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'showBreadcrumbs', label: 'Breadcrumb Navigation' },
                    { key: 'showCategoryBadge', label: 'Category Topic Badge' },
                    { key: 'showPublishDate', label: 'Publication Date' },
                    { key: 'showReadingTime', label: 'Estimated Reading Time' },
                    { key: 'showAuthorBio', label: 'Author Avatar & Bio' },
                    { key: 'showTags', label: 'Tag Badges List' },
                    { key: 'showShareButtons', label: 'Social Share Buttons' },
                    { key: 'showRelatedPosts', label: 'Related Posts Grid' },
                    { key: 'showComments', label: 'Comments Discussion' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={!!(selectedTemplate as any)[item.key]}
                        onChange={(e) => updateSelectedTemplate({ [item.key]: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Template-Specific CSS Override */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-blue-600" />
                    <span>Template-Specific Custom CSS</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Scoped only to {selectedTemplate.name}</span>
                </div>
                <textarea
                  rows={3}
                  value={selectedTemplate.customCss || ''}
                  onChange={(e) => updateSelectedTemplate({ customCss: e.target.value })}
                  placeholder={`/* Custom CSS for ${selectedTemplate.name} */\n.article-content h2 { border-bottom: 2px solid #2563eb; }`}
                  className="w-full text-xs font-mono bg-slate-900 text-emerald-300 p-3 rounded-xl border border-slate-800 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
