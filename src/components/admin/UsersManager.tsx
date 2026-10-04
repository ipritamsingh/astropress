import React, { useState } from 'react';
import { Author } from '../../types/cms';
import { Users, Shield, Plus, GitBranch, Key, CheckCircle, ExternalLink } from 'lucide-react';

interface Props {
  authors: Author[];
  onNavigateToSecurity?: () => void;
}

export const UsersManager: React.FC<Props> = ({ authors, onNavigateToSecurity }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Users & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authors, editors, administrator credentials, and emergency recovery keys
          </p>
        </div>
        {onNavigateToSecurity && (
          <button
            onClick={onNavigateToSecurity}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>Manage Administrator Account & Security</span>
          </button>
        )}
      </div>

      {/* GitHub Git-Backed Permission Architecture Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <Shield className="h-4 w-4" />
          <span>Sveltia CMS & Git Provider Security Model</span>
        </div>
        <h3 className="text-base font-bold text-white">How Roles & Access Work in Git-Backed Publishing</h3>
        <p className="text-slate-300 leading-relaxed text-xs">
          Because AstroPress and Sveltia CMS are backed directly by your GitHub repository, user access maps directly
          to GitHub collaborator permissions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="font-bold text-white block mb-0.5">Admin (Repo Owner/Admin)</span>
            <span className="text-slate-400 text-[11px]">
              Full control over code, Cloudflare deployment settings, and Sveltia config.yml.
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="font-bold text-white block mb-0.5">Editor (Repo Write Access)</span>
            <span className="text-slate-400 text-[11px]">
              Can write, publish, delete, and merge content branches into main via Sveltia CMS.
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="font-bold text-white block mb-0.5">Contributor (Repo Triage / Fork)</span>
            <span className="text-slate-400 text-[11px]">
              Submits draft posts as pull requests or drafts under editorial review workflow.
            </span>
          </div>
        </div>
      </div>

      {/* User Profiles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">GitHub Profile</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {authors.map((author) => (
              <tr key={author.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">{author.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">@{author.slug}</span>
                  </div>
                </td>

                <td className="p-4 font-medium text-slate-700">{author.email}</td>

                <td className="p-4">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                    {author.role}
                  </span>
                </td>

                <td className="p-4 font-mono text-slate-500 text-[11px]">
                  {author.github ? (
                    <a
                      href={`https://github.com/${author.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>github.com/{author.github}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle className="h-3 w-3" />
                    <span>Active</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
