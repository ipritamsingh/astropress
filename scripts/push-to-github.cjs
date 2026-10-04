const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const repo = process.argv[3] || process.env.GITHUB_REPO || 'ipritamsingh/astropress';
const branch = process.argv[4] || process.env.GITHUB_BRANCH || 'main';

if (!token) {
  console.error('Usage: node scripts/push-to-github.cjs <GITHUB_PAT> [owner/repo] [branch]');
  console.error('Example: node scripts/push-to-github.cjs ghp_xxxx ipritamsingh/astropress main');
  process.exit(1);
}

const cleanToken = token.trim();
const cleanRepo = repo.trim();
const cleanBranch = branch.trim();
const rootDir = path.resolve(__dirname, '..');

console.log(`Starting push of complete AstroPress project to https://github.com/${cleanRepo} on branch "${cleanBranch}"...`);

try {
  // Configure remote authenticated URL
  const remoteUrl = `https://${cleanToken}@github.com/${cleanRepo}.git`;
  
  // Ensure all changes are committed
  execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });
  try {
    execSync('git commit -m "feat: complete AstroPress project synchronization for Cloudflare Pages"', {
      cwd: rootDir,
      stdio: 'inherit',
    });
  } catch (e) {
    // If nothing to commit, continue
  }

  // Push main branch to remote
  console.log(`Pushing to ${cleanRepo} (${cleanBranch})...`);
  execSync(`git push ${remoteUrl} ${cleanBranch}`, { cwd: rootDir, stdio: 'inherit' });

  console.log(`\n Successfully pushed complete project to https://github.com/${cleanRepo} (${cleanBranch})!`);
} catch (err) {
  console.error('\n❌ Push failed:', err.message);
  process.exit(1);
}
