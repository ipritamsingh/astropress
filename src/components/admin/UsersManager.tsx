import React, { useState } from 'react';
import { Author } from '../../types/cms';
import {
  Users,
  Shield,
  Plus,
  GitBranch,
  Key,
  CheckCircle,
  ExternalLink,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserPlus,
  X,
  Sparkles,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface Props {
  authors: Author[];
  onAddAuthor?: (author: Author) => void;
  onUpdateAuthorRole?: (id: string, role: string) => void;
  onDeleteAuthor?: (id: string) => void;
  onNavigateToSecurity?: () => void;
  currentUserEmail?: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
];

export const UsersManager: React.FC<Props> = ({
  authors,
  onAddAuthor,
  onUpdateAuthorRole,
  onDeleteAuthor,
  onNavigateToSecurity,
  currentUserEmail,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  // Form State for Adding New User
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Editor' | 'Contributor'>('Administrator');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to determine if an author is the Primary Administrator (protected)
  const isPrimaryAdministrator = (author: Author, index: number): boolean => {
    if (author.id === 'auth-1') return true;
    if (
      currentUserEmail &&
      author.email &&
      author.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
    ) {
      return true;
    }
    const roleLower = (author.role || '').toLowerCase();
    if (roleLower.includes('lead architect') || roleLower.includes('primary')) {
      return true;
    }
    // Fallback: If no other match and this is index 0 with an admin/architect role
    if (index === 0 && (roleLower.includes('admin') || roleLower.includes('lead') || roleLower.includes('editor-in-chief'))) {
      return true;
    }
    return false;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSlug = slug.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!cleanName) {
      setErrorMsg('Please enter a full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Check for duplicate email or slug
    const duplicate = authors.find(
      (a) => a.email.toLowerCase() === cleanEmail || a.slug.toLowerCase() === cleanSlug.toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`A user with email "${cleanEmail}" or handle "@${cleanSlug}" already exists.`);
      return;
    }

    const newAuthor: Author = {
      id: 'auth-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      slug: cleanSlug,
      email: cleanEmail,
      role: role,
      avatar: avatar || AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
      bio: bio.trim() || `${role} on AstroPress publishing platform.`,
      github: github.trim() ? github.trim().replace(/^@/, '') : undefined,
    };

    if (onAddAuthor) {
      onAddAuthor(newAuthor);
    }

    setSuccessMsg(`User "${cleanName}" (${role}) created successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);

    // Reset Form
    setName('');
    setSlug('');
    setEmail('');
    setBio('');
    setGithub('');
    setRole('Administrator');
    setAvatar(AVATAR_PRESETS[0]);
    setShowAddModal(false);
  };

  const handleRoleChange = (author: Author, index: number, newRole: string) => {
    if (isPrimaryAdministrator(author, index)) {
      alert('The Primary Administrator role is protected and cannot be demoted.');
      return;
    }
    if (onUpdateAuthorRole) {
      onUpdateAuthorRole(author.id, newRole);
    }
  };

  const handleConfirmDelete = () => {
    if (!authorToDelete) return;
    const authorIdx = authors.findIndex((a) => a.id === authorToDelete.id);
    if (isPrimaryAdministrator(authorToDelete, authorIdx)) {
      alert('The Primary Administrator cannot be removed.');
      setAuthorToDelete(null);
      return;
    }

    if (onDeleteAuthor) {
      onDeleteAuthor(authorToDelete.id);
    }
    setSuccessMsg(`User "${authorToDelete.name}" has been removed.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    setAuthorToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Users & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authors, editors, administrator credentials, and emergency recovery keys
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New User</span>
          </button>
          {onNavigateToSecurity && (
            <button
              onClick={onNavigateToSecurity}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Administrator Security</span>
            </button>
          )}
        </div>
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
            <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-purple-400" />
              <span>Administrator</span>
            </span>
            <span className="text-slate-400 text-[11px] block mt-1">
              Full administrative control over code, theme customizer, user management, and Cloudflare deployment.
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
              <span>Editor</span>
            </span>
            <span className="text-slate-400 text-[11px] block mt-1">
              Can write, publish, delete, and merge content branches into main via Sveltia CMS.
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="font-bold text-white block mb-0.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Contributor</span>
            </span>
            <span className="text-slate-400 text-[11px] block mt-1">
              Submits draft posts as pull requests or drafts under editorial review workflow.
            </span>
          </div>
        </div>
      </div>

      {/* User Profiles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Configured System Users ({authors.length})</h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Changes are saved to persistent CMS state and synchronized with repository
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">User Profile</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Role & Privileges</th>
                <th className="p-4">GitHub Profile</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authors.map((author, index) => {
                const isPrimary = isPrimaryAdministrator(author, index);
                const roleText = author.role || 'Contributor';
                const isRoleAdmin = roleText.toLowerCase().includes('admin') || isPrimary;
                const isRoleEditor = !isRoleAdmin && (roleText.toLowerCase().includes('editor') || roleText.toLowerCase().includes('staff'));

                return (
                  <tr key={author.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <img
                        src={author.avatar || AVATAR_PRESETS[0]}
                        alt={author.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="block text-sm font-bold text-slate-900">{author.name}</span>
                          {isPrimary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              <Shield className="h-2.5 w-2.5 text-amber-600" />
                              Primary Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">@{author.slug}</span>
                      </div>
                    </td>

                    <td className="p-4 font-medium text-slate-700">{author.email}</td>

                    <td className="p-4">
                      {isPrimary ? (
                        <div className="flex items-center gap-1.5" title="Primary Administrator role cannot be modified">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-200">
                            <Lock className="h-3 w-3 text-purple-600" />
                            <span>Administrator (Owner)</span>
                          </span>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={
                              isRoleAdmin ? 'Administrator' : isRoleEditor ? 'Editor' : 'Contributor'
                            }
                            onChange={(e) => handleRoleChange(author, index, e.target.value)}
                            className={`px-3 py-1 pr-7 rounded-full font-bold text-[11px] border appearance-none cursor-pointer focus:outline-hidden transition-colors ${
                              isRoleAdmin
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : isRoleEditor
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            }`}
                          >
                            <option value="Administrator">Administrator</option>
                            <option value="Editor">Editor</option>
                            <option value="Contributor">Contributor</option>
                          </select>
                          <ChevronDown className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      )}
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

                    <td className="p-4 text-right">
                      {isPrimary ? (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Protected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAuthorToDelete(author)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold transition-colors inline-flex items-center gap-1 border border-transparent hover:border-rose-200"
                          title={`Remove ${author.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER / ADMINISTRATOR                                       */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New User</h3>
                  <p className="text-[11px] text-slate-500">Configure new author or administrator account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Username / Handle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. alex-morgan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Assigned Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Administrator">Administrator (Full Access)</option>
                    <option value="Editor">Editor (Publish & Edit)</option>
                    <option value="Contributor">Contributor (Draft Submissions)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">GitHub Profile Username</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="e.g. alexmorgan (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bio / Editorial Title</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Senior Tech Editor & Cloud Infrastructure Specialist"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Avatar Selection</label>
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <img
                      key={idx}
                      src={p}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setAvatar(p)}
                      className={`h-9 w-9 rounded-full object-cover cursor-pointer transition-all ${
                        avatar === p
                          ? 'ring-3 ring-blue-600 scale-105 shadow-xs'
                          : 'opacity-60 hover:opacity-100 ring-1 ring-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {role === 'Administrator' && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
                  <Shield className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Administrator Privileges</span>
                    <span className="text-[11px] text-purple-700">
                      This user will have full access to modify content, site settings, customizers, and manage system users.
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM REMOVE ADMINISTRATOR / USER                                */}
      {/* ========================================================================= */}
      {authorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {authorToDelete.role?.toLowerCase().includes('admin')
                    ? 'Confirm Administrator Removal'
                    : 'Confirm User Removal'}
                </h3>
                <p className="text-[11px] text-slate-500">This action will revoke the user’s platform access</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img
                src={authorToDelete.avatar || AVATAR_PRESETS[0]}
                alt={authorToDelete.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-xs shrink-0"
              />
              <div className="overflow-hidden">
                <span className="font-bold text-sm text-slate-900 block truncate">{authorToDelete.name}</span>
                <span className="text-[11px] text-slate-500 block truncate">{authorToDelete.email}</span>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {authorToDelete.role}
                </span>
              </div>
            </div>

            {authorToDelete.role?.toLowerCase().includes('admin') && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold block">⚠️ Administrative Access Revocation</span>
                <span className="text-[11px] text-amber-800">
                  Removing this administrator will prevent them from making any further changes to the CMS, site configuration, or publishing pipeline.
                </span>
              </div>
            )}

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently remove <strong>{authorToDelete.name}</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuthorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-xs"
              >
                Yes, Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
