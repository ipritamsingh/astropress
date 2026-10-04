import React, { useState } from 'react';
import { Page } from '../../types/cms';
import { Plus, Edit3, Trash2, ExternalLink, Files, Copy } from 'lucide-react';

interface Props {
  pages: Page[];
  onNewPage: () => void;
  onEditPage: (page: Page) => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onViewPage: (page: Page) => void;
}

export const PagesManager: React.FC<Props> = ({
  pages,
  onNewPage,
  onEditPage,
  onDeletePage,
  onDuplicatePage,
  onViewPage,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pages</span>
            <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {pages.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage static and standalone content pages</p>
        </div>

        <button
          onClick={onNewPage}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Page</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Page Title</th>
                <th className="p-4">Slug / Path</th>
                <th className="p-4">Template</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 font-bold text-slate-900">
                    <span
                      onClick={() => onEditPage(page)}
                      className="hover:text-blue-600 cursor-pointer text-sm"
                    >
                      {page.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 group-hover:text-slate-600">
                      <button
                        onClick={() => onEditPage(page)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => onDuplicatePage(page.id)}
                        className="hover:underline"
                      >
                        Duplicate
                      </button>
                      <span>|</span>
                      <button onClick={() => onViewPage(page)} className="hover:underline">
                        View
                      </button>
                      {page.slug !== 'home' && (
                        <>
                          <span>|</span>
                          <button
                            onClick={() => {
                              if (confirm(`Delete page "${page.title}"?`)) onDeletePage(page.id);
                            }}
                            className="text-rose-600 hover:underline"
                          >
                            Trash
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="p-4 font-mono text-slate-500 text-xs">
                    /{page.slug === 'home' ? '' : page.slug}
                  </td>

                  <td className="p-4">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 font-medium text-[11px]">
                      {page.template}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        page.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditPage(page)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Edit Page"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onViewPage(page)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        title="View on Site"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
