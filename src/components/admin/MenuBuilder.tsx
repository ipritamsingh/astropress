import React, { useState } from 'react';
import { Menu, MenuItem, Page, Category } from '../../types/cms';
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Check,
  Save,
} from 'lucide-react';

interface Props {
  menus: Menu[];
  pages: Page[];
  categories: Category[];
  onSaveMenus: (menus: Menu[]) => void;
}

export const MenuBuilder: React.FC<Props> = ({ menus, pages, categories, onSaveMenus }) => {
  const [localMenus, setLocalMenus] = useState<Menu[]>(menus);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || 'menu-main');
  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeMenu = localMenus.find((m) => m.id === selectedMenuId) || localMenus[0];

  const updateMenuItems = (newItems: MenuItem[]) => {
    const updated = localMenus.map((m) => (m.id === activeMenu.id ? { ...m, items: newItems } : m));
    setLocalMenus(updated);
  };

  const handleSave = () => {
    onSaveMenus(localMenus);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const addCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel || !customUrl) return;
    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      label: customLabel,
      url: customUrl,
    };
    updateMenuItems([...activeMenu.items, newItem]);
    setCustomLabel('');
    setCustomUrl('');
  };

  const addPageLink = (page: Page) => {
    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      label: page.title,
      url: page.slug === 'home' ? '/' : `/${page.slug}`,
    };
    updateMenuItems([...activeMenu.items, newItem]);
  };

  const addCategoryLink = (cat: Category) => {
    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      label: cat.name,
      url: `/category/${cat.slug}`,
    };
    updateMenuItems([...activeMenu.items, newItem]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeMenu.items.length) return;
    const newItems = [...activeMenu.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIdx, 0, moved);
    updateMenuItems(newItems);
  };

  const deleteItem = (id: string) => {
    updateMenuItems(activeMenu.items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Navigation Menus</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage Header, Footer, and Mobile menu structures</p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'Saved!' : 'Save Menu'}</span>
        </button>
      </div>

      {/* Select Menu to Edit */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700">Select a menu to edit:</span>
        <select
          value={selectedMenuId}
          onChange={(e) => setSelectedMenuId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800"
        >
          {localMenus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.location})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add Menu Items Drawer (Pages, Categories, Custom Links) */}
        <div className="space-y-4">
          {/* Add Pages */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pages</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs">
                  <span className="font-medium text-slate-700">{p.title}</span>
                  <button
                    onClick={() => addPageLink(p)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs">
                  <span className="font-medium text-slate-700">{c.name}</span>
                  <button
                    onClick={() => addCategoryLink(c)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Link */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Link</h3>
            <form onSubmit={addCustomLink} className="space-y-2 text-xs">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="URL (e.g. /posts or https://...)"
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
              />
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Link Text (e.g. Documentation)"
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Add to Menu
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Menu Structure & Hierarchy */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Menu Structure</h3>
            <p className="text-xs text-slate-500">
              Drag or use the up/down arrows to reorder items in this menu.
            </p>
          </div>

          <div className="space-y-2">
            {activeMenu?.items?.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400">{index + 1}.</span>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{item.label}</span>
                    <span className="font-mono text-[11px] text-slate-400">{item.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20"
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === activeMenu.items.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20"
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    title="Remove Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
