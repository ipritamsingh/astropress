import React, { useState } from 'react';
import { Category, Tag } from '../../types/cms';
import { Plus, Trash2, Edit2, FolderTree, Tag as TagIcon, Check } from 'lucide-react';

interface Props {
  categories: Category[];
  tags: Tag[];
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveTag: (tag: Tag) => void;
  onDeleteTag: (id: string) => void;
  postCountsByCategory: Record<string, number>;
}

export const CategoriesManager: React.FC<Props> = ({
  categories,
  tags,
  onSaveCategory,
  onDeleteCategory,
  onSaveTag,
  onDeleteTag,
  postCountsByCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#2563eb');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Tag Form State
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const newCategory: Category = {
      id: editingCatId || 'cat-' + Date.now(),
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: catDesc,
      color: catColor,
    };

    onSaveCategory(newCategory);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setEditingCatId(null);
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) return;

    const newTag: Tag = {
      id: editingTagId || 'tag-' + Date.now(),
      name: tagName,
      slug: tagSlug || tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    onSaveTag(newTag);
    setTagName('');
    setTagSlug('');
    setEditingTagId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Taxonomies Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Organize articles through structured categories and tags</p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tags' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            <span>Tags ({tags.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Category Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCatId ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug || !editingCatId) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Astro & Islands"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slug</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. astro-islands"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Category purpose and editorial guidelines..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Badge Color</span>
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="h-7 w-7 rounded-lg cursor-pointer border-0"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                >
                  {editingCatId ? 'Update Category' : 'Add New Category'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName('');
                      setCatSlug('');
                      setCatDesc('');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center">Count</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{c.slug}</td>
                    <td className="p-3.5 text-slate-600 max-w-[200px] truncate">{c.description || '—'}</td>
                    <td className="p-3.5 text-center font-bold text-blue-600">
                      {postCountsByCategory[c.name] || 0}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCatId(c.id);
                            setCatName(c.name);
                            setCatSlug(c.slug);
                            setCatDesc(c.description);
                            setCatColor(c.color);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete category "${c.name}"?`)) onDeleteCategory(c.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Tag Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingTagId ? 'Edit Tag' : 'Add New Tag'}
            </h3>
            <form onSubmit={handleTagSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    if (!tagSlug || !editingTagId) {
                      setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Sveltia CMS"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slug</label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  placeholder="e.g. sveltia-cms"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
              >
                {editingTagId ? 'Update Tag' : 'Add New Tag'}
              </button>
            </form>
          </div>

          {/* Tags Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tags.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <TagIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{t.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{t.slug}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete tag "${t.name}"?`)) onDeleteTag(t.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
