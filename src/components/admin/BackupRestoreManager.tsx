import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  FileText,
  Files,
  FolderTree,
  Tag as TagIcon,
  Image as ImageIcon,
  Menu as MenuIcon,
  LayoutTemplate,
  Sliders,
  Sparkles,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';
import { CMSDataState } from '../../data/cmsStore';
import {
  createFullSiteBackup,
  validateBackupArchive,
  restoreFullSiteBackup,
  downloadBlob,
  generateBackupFilename,
  ParsedBackupData,
  BackupManifest,
  RestoredCounts,
} from '../../data/backupRestoreService';

interface Props {
  cms: any; // ReturnType of useCMS()
}

export const BackupRestoreManager: React.FC<Props> = ({ cms }) => {
  // Backup Creation State
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgressMsg, setBackupProgressMsg] = useState('');
  const [backupProgressPct, setBackupProgressPct] = useState(0);
  const [lastCreatedBackup, setLastCreatedBackup] = useState<{
    filename: string;
    sizeKb: number;
    manifest: BackupManifest;
  } | null>(null);

  // Restore State
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<ParsedBackupData | null>(null);

  // Restore Execution State
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressMsg, setRestoreProgressMsg] = useState('');
  const [restoreProgressPct, setRestoreProgressPct] = useState(0);
  const [restoreSuccess, setRestoreSuccess] = useState<{
    counts: RestoredCounts;
    safetyFilename: string;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Create Full Site Backup Action
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgressMsg('Gathering site assets...');
    setBackupProgressPct(5);

    try {
      const result = await createFullSiteBackup(cms as CMSDataState, (msg, pct) => {
        setBackupProgressMsg(msg);
        setBackupProgressPct(pct);
      });

      // Download archive immediately
      downloadBlob(result.blob, result.filename);

      setLastCreatedBackup({
        filename: result.filename,
        sizeKb: Math.round(result.blob.size / 1024),
        manifest: result.manifest,
      });
    } catch (err: any) {
      alert(`Failed to create backup: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 2. File Selection & Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationError(null);
    setParsedBackup(null);
    setRestoreSuccess(null);
    setRestoreError(null);
    setIsAnalyzingFile(true);

    try {
      const validation = await validateBackupArchive(file);
      if (!validation.valid || !validation.backupData) {
        setValidationError(validation.error || 'Invalid AstroPress backup archive.');
        setParsedBackup(null);
      } else {
        setParsedBackup(validation.backupData);
      }
    } catch (err: any) {
      setValidationError(`Failed to inspect archive: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handleCancelRestore = () => {
    setSelectedFile(null);
    setParsedBackup(null);
    setValidationError(null);
    setRestoreError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Execute Full Site Restore with Automatic Safety Backup
  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreProgressMsg('Creating automatic safety backup...');
    setRestoreProgressPct(10);

    try {
      // Step A: Mandatory Automatic Safety Backup
      const safetyBackup = await createFullSiteBackup(cms as CMSDataState, (msg, pct) => {
        setRestoreProgressMsg(`Safety backup: ${msg}`);
        setRestoreProgressPct(Math.round(pct * 0.4));
      });

      const safetyFilename = generateBackupFilename(true);
      downloadBlob(safetyBackup.blob, safetyFilename);

      // Step B: Transactional Restore
      setRestoreProgressMsg('Applying backup data to CMS...');
      setRestoreProgressPct(45);

      const restoreResult = await restoreFullSiteBackup(parsedBackup, cms as CMSDataState, (msg, pct) => {
        setRestoreProgressMsg(msg);
        setRestoreProgressPct(45 + Math.round(pct * 0.55));
      });

      if (!restoreResult.success) {
        throw new Error(restoreResult.error || 'Restore failed');
      }

      // Step C: Update in-memory CMS state immediately
      if (cms.restoreFullState) {
        cms.restoreFullState(restoreResult.finalState);
      }

      setRestoreSuccess({
        counts: restoreResult.restoredCounts,
        safetyFilename,
      });

      // Clear staged file
      setSelectedFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore site from backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="h-6 w-6 text-teal-600" />
            <span>Backup & Restore</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete snapshot management for all AstroPress content, media assets, navigation, and theme configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Zero-Risk · Safety Snapshots</span>
          </span>
        </div>
      </div>

      {/* Restore Success Banner */}
      {restoreSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-emerald-950">Full Site Restore Completed Successfully!</h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  All content, taxonomies, settings, and media files have been updated.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRestoreSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-900">
            <div>
              <span className="font-semibold block text-[11px] text-emerald-700">Posts Restored</span>
              <span className="font-bold text-sm font-mono">{restoreSuccess.counts.posts}</span>
            </div>
            <div>
              <span className="font-semibold block text-[11px] text-emerald-700">Pages Restored</span>
              <span className="font-bold text-sm font-mono">{restoreSuccess.counts.pages}</span>
            </div>
            <div>
              <span className="font-semibold block text-[11px] text-emerald-700">Media Items</span>
              <span className="font-bold text-sm font-mono">{restoreSuccess.counts.media}</span>
            </div>
            <div>
              <span className="font-semibold block text-[11px] text-emerald-700">Media Files Extracted</span>
              <span className="font-bold text-sm font-mono">{restoreSuccess.counts.mediaFiles}</span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <span>
              🛡️ An automatic safety backup (<strong>{restoreSuccess.safetyFilename}</strong>) was saved to your downloads folder before restoration.
            </span>
          </div>
        </div>
      )}

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* CARD 1: CREATE FULL SITE BACKUP                                           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Create Full Site Backup</h2>
                <p className="text-xs text-slate-500">Download a complete, self-contained archive of your site.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generates a structured <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">.zip</code> archive containing all Markdown posts, draft entries, pages, taxonomies, menu structures, theme options, SEO parameters, and actual media asset files.
            </p>

            {/* Content Included Checklist */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                Archive Contents ({cms.posts?.length || 0} Posts · {cms.pages?.length || 0} Pages · {cms.media?.length || 0} Media)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Posts & Drafts ({cms.posts?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Files className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Pages ({cms.pages?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderTree className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>Categories ({cms.categories?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TagIcon className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                  <span>Tags ({cms.tags?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Media Assets ({cms.media?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MenuIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Menus & Header ({cms.menus?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>Homepage Builder</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>SEO & Theme Settings</span>
                </div>
              </div>
            </div>

            {/* Progress indicator during creation */}
            {isCreatingBackup && (
              <div className="space-y-1.5 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>{backupProgressMsg}</span>
                  </span>
                  <span>{backupProgressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-150"
                    style={{ width: `${backupProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last created backup indicator */}
            {lastCreatedBackup && !isCreatingBackup && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Latest Generated Backup</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate block max-w-xs">
                    {lastCreatedBackup.filename}
                  </span>
                </div>
                <span className="font-bold text-slate-600 text-xs bg-white px-2 py-1 rounded-md border border-slate-200">
                  {lastCreatedBackup.sizeKb} KB
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating Backup Archive...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Create Full Site Backup</span>
              </>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: RESTORE BACKUP                                                    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Restore from Backup</h2>
                <p className="text-xs text-slate-500">Restore site data from an AstroPress backup ZIP.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a previously downloaded AstroPress backup archive. The system validates the manifest and previews content counts before asking for confirmation.
            </p>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Drop/Pick Target */}
            {!parsedBackup && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  validationError
                    ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                <FileArchive className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <span className="font-bold text-xs text-slate-800 block">
                  {isAnalyzingFile ? 'Inspecting archive...' : 'Click to Select Backup ZIP Archive'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Supports .zip files generated by AstroPress
                </span>
              </div>
            )}

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Archive Validation Failed</span>
                  <span className="text-[11px] leading-relaxed block mt-0.5">{validationError}</span>
                </div>
              </div>
            )}

            {/* Restore Execution Error Alert */}
            {restoreError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Restore Error</span>
                  <span className="text-[11px] leading-relaxed block mt-0.5">{restoreError}</span>
                </div>
              </div>
            )}

            {/* RESTORE PREVIEW CARD */}
            {parsedBackup && (
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Archive Preview</span>
                    <h3 className="font-extrabold text-xs text-slate-900 truncate max-w-xs">
                      {selectedFile?.name}
                    </h3>
                  </div>
                  <button
                    onClick={handleCancelRestore}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                    title="Cancel selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Posts / Drafts</span>
                    <span className="font-bold text-slate-900">
                      {parsedBackup.posts.length} ({parsedBackup.manifest.counts.drafts} drafts)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pages</span>
                    <span className="font-bold text-slate-900">{parsedBackup.pages.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Media Files</span>
                    <span className="font-bold text-slate-900">{parsedBackup.mediaAssets.size} in archive</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Categories</span>
                    <span className="font-bold text-slate-900">{parsedBackup.categories.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tags</span>
                    <span className="font-bold text-slate-900">{parsedBackup.tags.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Settings</span>
                    <span className="font-bold text-emerald-700">Available</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>⚠️ Automatic Safety Backup:</strong> A complete backup of your current site state will be downloaded automatically before restoring. Matching posts and pages will be cleanly updated without creating duplicate entries.
                </div>

                {/* Restore Progress Bar */}
                {isRestoring && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                        <span>{restoreProgressMsg}</span>
                      </span>
                      <span>{restoreProgressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-150"
                        style={{ width: `${restoreProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button Row */}
          {parsedBackup ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Restoring Site...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Restore Full Site</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzingFile}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Choose Backup File</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 3: ARCHITECTURE & SAFETY SPECIFICATION                               */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Info className="h-4.5 w-4.5 text-blue-600" />
          <span>AstroPress Backup Architecture & Safety Protocol</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-900 block text-xs">Self-Contained Archives</span>
            <p className="leading-relaxed text-[11px]">
              Backups are standard ZIP files containing human-readable JSON files and binary media assets. They can be safely archived on any offline disk, external drive, or cloud storage.
            </p>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-900 block text-xs">Pre-Restore Safety Snapshot</span>
            <p className="leading-relaxed text-[11px]">
              Before any restore operation executes, AstroPress automatically exports and downloads a complete safety snapshot of your active CMS state, preventing accidental data loss.
            </p>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-900 block text-xs">Zero Unintended Deployments</span>
            <p className="leading-relaxed text-[11px]">
              Backup and restore operations execute strictly on your local CMS environment. They never create unauthorized Git commits, push to GitHub, or trigger Cloudflare deployments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
