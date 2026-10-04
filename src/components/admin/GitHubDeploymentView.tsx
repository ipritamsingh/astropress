import React, { useState } from 'react';
import {
  Post,
  Page,
  GitCommitRecord,
  DeploymentSettings,
  HeroSectionConfig,
  ThemeSettings,
  Category,
  Tag,
  MediaItem,
  Menu,
} from '../../types/cms';
import {
  checkGitHubConnection,
  executeRealGitHubPublish,
  executeFullRepositoryPush,
  ConnectionStatus,
} from '../../data/githubPublishService';
import {
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Server,
  Cloud,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  FileText,
  Save,
  Check,
  Lock,
  Eye,
  EyeOff,
  Key,
  HelpCircle,
  ArrowRight,
  UploadCloud,
  X,
} from 'lucide-react';

interface Props {
  posts: Post[];
  pages: Page[];
  deploymentSettings: DeploymentSettings;
  commitHistory: GitCommitRecord[];
  sessionToken?: string;
  heroConfig?: HeroSectionConfig;
  themeSettings?: ThemeSettings;
  categories?: Category[];
  tags?: Tag[];
  media?: MediaItem[];
  menus?: Menu[];
  onUpdateSessionToken?: (token: string) => void;
  onUpdateDeploymentSettings: (settings: Partial<DeploymentSettings>) => void;
  onRecordCommit: (message: string) => void;
  onUpdateGithubSyncStatus?: (status: 'Connected' | 'Syncing' | 'Error' | 'Disconnected') => void;
}

export const GitHubDeploymentView: React.FC<Props> = ({
  posts,
  pages,
  deploymentSettings,
  commitHistory,
  sessionToken = '',
  heroConfig,
  themeSettings,
  categories,
  tags,
  media,
  menus,
  onUpdateSessionToken,
  onUpdateDeploymentSettings,
  onRecordCommit,
  onUpdateGithubSyncStatus,
}) => {
  const initialRepoString = deploymentSettings.githubRepo || 'ipritamsingh/astropress';
  const [initialOwner, initialRepoName] = initialRepoString.split('/');

  const [owner, setOwner] = useState(initialOwner || 'ipritamsingh');
  const [repoName, setRepoName] = useState(initialRepoName || 'astropress');
  const [branch, setBranch] = useState(deploymentSettings.githubBranch || 'main');
  const [token, setToken] = useState(sessionToken || deploymentSettings.githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const initialWorker =
    deploymentSettings.cloudflareWorkerUrl?.includes('sveltia-authenticator') ||
    deploymentSettings.cloudflareWorkerUrl?.includes('authenticator.workers.dev')
      ? ''
      : deploymentSettings.cloudflareWorkerUrl || '';

  const [workerUrl, setWorkerUrl] = useState(initialWorker);
  const [cloudflarePagesProject, setCloudflarePagesProject] = useState(
    deploymentSettings.cloudflarePagesProject || ''
  );
  const [productionUrl, setProductionUrl] = useState(deploymentSettings.productionUrl || '');
  const [autoDeploy, setAutoDeploy] = useState(Boolean(deploymentSettings.autoDeployOnPublish));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Connection testing state
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  // Batch Publish & Full Sync State
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);
  const [pushProgress, setPushProgress] = useState<{
    current: number;
    total: number;
    filePath: string;
    status: 'pushing' | 'done' | 'error';
  } | null>(null);
  const [pushResultSummary, setPushResultSummary] = useState<{
    success: boolean;
    totalPushed: number;
    totalFiles: number;
    commitSha?: string;
    commitUrl?: string;
    verifiedRootFiles?: string[];
    message: string;
    failedFiles?: { path: string; error: string }[];
  } | null>(null);

  const draftPosts = posts.filter((p) => p.status === 'draft');
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPages = pages.filter((p) => p.status === 'draft');
  const publishedPages = pages.filter((p) => p.status === 'published');
  const lastCommit = commitHistory[0];

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      const status = await checkGitHubConnection(owner, repoName, branch, token, workerUrl);
      setConnectionStatus(status);
      if (onUpdateGithubSyncStatus) {
        onUpdateGithubSyncStatus(status.connected ? 'Connected' : 'Error');
      }
    } catch (err: any) {
      const errorStatus: ConnectionStatus = {
        connected: false,
        repo: `${owner}/${repoName}`,
        branch,
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
        message: `Connection check failed: ${err.message || 'Unknown network error'}.`,
      };
      setConnectionStatus(errorStatus);
      if (onUpdateGithubSyncStatus) {
        onUpdateGithubSyncStatus('Error');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleBatchPushToGitHub = async () => {
    const activeToken = (token || sessionToken || '').trim();
    if (!activeToken) {
      alert('Please enter your GitHub Personal Access Token (PAT) first in the form below.');
      return;
    }

    setIsPublishingBatch(true);
    setPushResultSummary(null);
    setPushProgress({ current: 0, total: 1, filePath: 'Preparing files for sync...', status: 'pushing' });

    // Instantly notify topbar status indicator that a push/sync is in progress
    if (onUpdateGithubSyncStatus) {
      onUpdateGithubSyncStatus('Syncing');
    }

    try {
      const settings: DeploymentSettings = {
        githubRepo: `${owner.trim()}/${repoName.trim()}`,
        githubBranch: branch.trim() || 'main',
        githubToken: activeToken,
        cloudflareWorkerUrl: workerUrl.trim(),
        cloudflarePagesProject: deploymentSettings.cloudflarePagesProject || 'astropress',
        productionUrl: productionUrl.trim(),
        autoDeployOnPublish: autoDeploy,
      };

      const result = await executeFullRepositoryPush({
        posts,
        pages,
        heroConfig,
        themeSettings,
        categories,
        tags,
        media,
        menus,
        deploymentSettings: settings,
        sessionToken: activeToken,
        onProgress: (info) => {
          setPushProgress(info);
        },
      });

      setPushResultSummary(result);

      if (result.success) {
        if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Connected');
        onRecordCommit(
          `feat(sync): pushed ${result.totalPushed} content & configuration files to ${owner}/${repoName} (${branch})`
        );
      } else {
        if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Error');
      }
    } catch (err: any) {
      if (onUpdateGithubSyncStatus) onUpdateGithubSyncStatus('Error');
      setPushResultSummary({
        success: false,
        totalPushed: 0,
        totalFiles: 0,
        message: `Sync operation failed: ${err.message || 'Unknown network error'}`,
      });
    } finally {
      setIsPublishingBatch(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const fullRepo = `${owner.trim()}/${repoName.trim()}`;
    
    if (onUpdateSessionToken) {
      onUpdateSessionToken(token);
    }

    onUpdateDeploymentSettings({
      githubRepo: fullRepo,
      githubBranch: branch.trim() || 'main',
      githubToken: token.trim(),
      productionUrl: productionUrl.trim(),
      cloudflarePagesProject: cloudflarePagesProject.trim(),
      cloudflareWorkerUrl: workerUrl.trim(),
      autoDeployOnPublish: autoDeploy,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-purple-600" />
            <span>GitHub & Cloudflare Deployment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure live GitHub repository access, secure Personal Access Token (PAT), and Cloudflare Pages deployment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Verifying with GitHub...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleBatchPushToGitHub}
            disabled={isPublishingBatch || (!token && !sessionToken)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all disabled:opacity-50 cursor-pointer ${
              pushResultSummary?.success
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95'
            }`}
          >
            <UploadCloud className={`h-4 w-4 ${isPublishingBatch ? 'animate-spin' : ''}`} />
            <span>
              {isPublishingBatch
                ? 'Pushing to GitHub...'
                : pushResultSummary?.success
                ? 'Push Complete!'
                : 'Push to GitHub'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Progress Bar Card during Push */}
      {isPublishingBatch && (
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-800/50 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
                <RefreshCw className="h-6 w-6 text-purple-300 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Pushing Repository Files to GitHub...</span>
                  <span className="text-xs font-mono bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                    {pushProgress ? `${Math.round((pushProgress.current / pushProgress.total) * 100)}%` : '0%'}
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Committing files to <code className="font-mono text-purple-300 font-bold">{owner}/{repoName}</code> ({branch}) using session token
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-purple-500/20 self-start sm:self-auto">
              {pushProgress ? `File ${pushProgress.current} of ${pushProgress.total}` : 'Initializing...'}
            </span>
          </div>

          {/* Progress Bar Track */}
          {pushProgress && (
            <div className="space-y-2">
              <div className="w-full bg-slate-950/70 rounded-full h-3 overflow-hidden border border-purple-500/20 p-0.5">
                <div
                  className="bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(pushProgress.current / pushProgress.total) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-purple-300/90 font-mono">
                <span className="truncate max-w-lg">Uploading: <code className="text-white">{pushProgress.filePath}</code></span>
                <span>{pushProgress.status === 'pushing' ? 'Syncing...' : 'Complete'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Push Result Summary Feedback Card */}
      {pushResultSummary && !isPublishingBatch && (
        <div
          className={`rounded-2xl p-5 border shadow-lg space-y-3 transition-all ${
            pushResultSummary.success
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-900 bg-white'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-900 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  pushResultSummary.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {pushResultSummary.success ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {pushResultSummary.success
                    ? 'GitHub Synchronization & Commit Complete!'
                    : 'Push Encountered Errors'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{pushResultSummary.message}</p>
              </div>
            </div>

            <button
              onClick={() => setPushResultSummary(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {pushResultSummary.success && (
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs font-mono text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                    ✓ {pushResultSummary.totalPushed}/{pushResultSummary.totalFiles} Project Files Synced
                  </span>
                  <span>
                    Repo: <strong>{owner}/{repoName}</strong> ({branch})
                  </span>
                  {pushResultSummary.commitSha && (
                    <span>
                      Commit SHA:{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-700 font-bold">
                        {pushResultSummary.commitSha.substring(0, 7)}
                      </code>
                    </span>
                  )}
                </div>
                <a
                  href={`https://github.com/${owner}/${repoName}/commits/${branch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  <span>View Repository Commits</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {pushResultSummary.verifiedRootFiles && pushResultSummary.verifiedRootFiles.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-sans">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Verified GitHub Root Structure (Cloudflare Pages Ready):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {pushResultSummary.verifiedRootFiles.map((file, idx) => (
                      <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {pushResultSummary.failedFiles && pushResultSummary.failedFiles.length > 0 && (
            <div className="pt-2 border-t border-rose-200 space-y-1 text-xs">
              <span className="font-bold text-rose-800">Files with errors:</span>
              <ul className="list-disc pl-5 space-y-0.5 text-rose-700 font-mono text-[11px]">
                {pushResultSummary.failedFiles.map((f, idx) => (
                  <li key={idx}>
                    {f.path}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Live Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GitHub Repo Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[11px] uppercase tracking-wider">GitHub Repository</span>
            {connectionStatus ? (
              connectionStatus.connected ? (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>Connection Failed</span>
                </div>
              )
            ) : (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Ready to Test
              </span>
            )}
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 font-mono-custom truncate">
              {owner}/{repoName}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <span>Production Branch:</span>
              <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded font-bold font-mono">
                {branch}
              </code>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>PAT: {token ? 'Entered (In Memory)' : 'Not Configured'}</span>
            <span>{connectionStatus?.lastChecked ? `Checked ${connectionStatus.lastChecked}` : 'Click Test'}</span>
          </div>
        </div>

        {/* Cloudflare Pages Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[11px] uppercase tracking-wider">Cloudflare Pages</span>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                productionUrl
                  ? 'text-orange-600 bg-orange-50 border border-orange-200'
                  : 'text-slate-500 bg-slate-100 border border-slate-200'
              }`}
            >
              <Cloud className="h-3 w-3" />
              <span>{productionUrl ? 'Edge Deployment' : 'Not Connected'}</span>
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {cloudflarePagesProject || 'Not configured'}
            </div>
            {productionUrl ? (
              <a
                href={productionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium truncate"
              >
                <span className="truncate">{productionUrl}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 mt-1 block">
                Production URL: <em>Not configured</em>
              </span>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Auto-deploy: {autoDeploy && productionUrl ? 'Enabled' : 'Not configured'}</span>
            <span className={productionUrl ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
              {productionUrl ? 'Ready' : 'Pending Cloudflare Setup'}
            </span>
          </div>
        </div>

        {/* Last Commit & Publication Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[11px] uppercase tracking-wider">Last Commit SHA</span>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
              Production
            </span>
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 font-mono-custom flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-purple-600" />
              <span>{lastCommit?.id || 'No commits yet'}</span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-1">
              {lastCommit?.message || 'Ready to publish first article'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{lastCommit?.timestamp || 'N/A'}</span>
            <span className="text-emerald-600 font-semibold">Synced</span>
          </div>
        </div>
      </div>

      {/* Connection Test Result Message */}
      {connectionStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 ${
            connectionStatus.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {connectionStatus.connected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold">{connectionStatus.connected ? 'GitHub Connection Verified' : 'Connection Error'}</h4>
            <p className="leading-relaxed">{connectionStatus.message}</p>
            {connectionStatus.latencyMs > 0 && (
              <span className="text-[11px] opacity-75 block">API Latency: {connectionStatus.latencyMs}ms</span>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">GitHub Repository & Authentication Credentials</h3>
            <span className="text-xs text-slate-500">
              Enter your real repository details and Personal Access Token (PAT) for direct commit pushes
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saveSuccess ? 'Settings Saved!' : 'Save Repository Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Owner */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              GitHub Repository Owner / Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. amitsingh or your-org"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Repo Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Repository Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. astropress-cms"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Production Git Branch <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default branch connected to Cloudflare Pages.
            </span>
          </div>

          {/* GitHub PAT */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_... or github_pat_..."
                className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                title={showToken ? 'Hide Token' : 'Show Token'}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Required permissions: <strong>Contents: Read and write</strong>. Token stays in runtime memory.
            </span>
          </div>

          {/* Cloudflare Pages Project Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Cloudflare Pages Project Name
            </label>
            <input
              type="text"
              value={cloudflarePagesProject}
              onChange={(e) => setCloudflarePagesProject(e.target.value)}
              placeholder="e.g. astropress"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Enter your project name from the Cloudflare dashboard once created.
            </span>
          </div>

          {/* Production URL */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Production Website URL (Cloudflare Pages URL)
            </label>
            <input
              type="url"
              value={productionUrl}
              onChange={(e) => setProductionUrl(e.target.value)}
              placeholder="https://your-project.pages.dev"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Leave blank until your Cloudflare Pages deployment is live.
            </span>
          </div>

          {/* Cloudflare Worker Proxy URL (Optional) */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Cloudflare Worker Proxy URL (Optional Secure Relay)
            </label>
            <input
              type="url"
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value)}
              placeholder="https://astropress-github-proxy.workers.dev"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Optional backend proxy for zero-client-token workflows. Leave blank for direct GitHub REST API access with your PAT.
            </span>
          </div>
        </div>

        {/* Cloudflare Pages Build Settings Reference Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">Recommended Cloudflare Pages Build Settings:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Framework</span>
              <strong className="text-slate-800">Astro</strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Root Directory</span>
              <strong className="text-slate-800">/ (Root)</strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Build Command</span>
              <strong className="text-slate-800">npm run build</strong>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Output Directory</span>
              <strong className="text-slate-800">dist</strong>
            </div>
          </div>
        </div>

        {/* Auto Deploy Checkbox */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            id="autoDeploy"
            checked={autoDeploy}
            onChange={(e) => setAutoDeploy(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-slate-300"
          />
          <label htmlFor="autoDeploy" className="font-medium text-slate-700 text-xs cursor-pointer">
            Trigger Cloudflare Pages build automatically upon publishing a post or page
          </label>
        </div>
      </form>

      {/* Security & PAT Guide */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
          <Key className="h-4 w-4" />
          <span>GitHub Token Security & Minimum Required Scopes</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          For secure publishing, generate a <strong>Fine-grained Personal Access Token</strong> on GitHub with the following settings:
        </p>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li><strong>Repository Access</strong>: Only select repositories → Select your AstroPress repository.</li>
          <li><strong>Repository Permissions</strong>: <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">Contents: Read and write</code> (to commit markdown files and images).</li>
          <li><strong>Metadata</strong>: <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">Read-only</code> (default).</li>
        </ul>
        <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
          <span>Worker proxy script template available at: <code className="text-purple-300">src/workers/github-proxy.js</code></span>
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Create Fine-grained PAT</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Commit History / Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Production Commit Audit Log ({branch})</h3>
          </div>
          <span className="text-xs text-slate-400">{commitHistory.length} commits recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {commitHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400">No commits recorded yet.</div>
          ) : (
            commitHistory.map((c) => (
              <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <code className="text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded font-bold text-[11px] shrink-0">
                    {c.id}
                  </code>
                  <span className="font-semibold text-slate-800 truncate">{c.message}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                  <span>{c.author.split('<')[0]}</span>
                  <span>•</span>
                  <span>{c.timestamp}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {c.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
