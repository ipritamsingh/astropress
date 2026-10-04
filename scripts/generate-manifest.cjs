const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', '.astro', 'build', 'coverage', '.cache']);
const IGNORED_FILES = new Set([
  'src/data/projectFilesManifest.ts',
  '.DS_Store',
  'bun.lock',
  'bun.lockb',
  'pnpm-lock.yaml',
  'yarn.lock'
]);

function getAllFiles(dir, baseDir = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        results = results.concat(getAllFiles(path.join(dir, entry.name), relativePath));
      }
    } else if (entry.isFile()) {
      if (!IGNORED_FILES.has(relativePath) && !relativePath.endsWith('.log')) {
        results.push(relativePath);
      }
    }
  }
  return results;
}

try {
  const filePaths = getAllFiles(rootDir).sort();
  const manifest = {};

  for (const relPath of filePaths) {
    const fullPath = path.join(rootDir, relPath);
    try {
      manifest[relPath] = fs.readFileSync(fullPath, 'utf8');
    } catch (e) {
      console.warn(`[Manifest Generator] Skipped reading ${relPath}: ${e.message}`);
    }
  }

  const outputPath = path.join(rootDir, 'src/data/projectFilesManifest.ts');
  const fileContent = `/**
 * Complete Project Files Manifest for AstroPress GitHub Synchronization
 * Contains all root configuration, build files, public assets, templates, and code
 */
export const projectFilesManifest: Record<string, string> = ${JSON.stringify(manifest, null, 2)};
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`[Manifest Generator] Successfully generated manifest with ${Object.keys(manifest).length} project files.`);
} catch (err) {
  console.error('[Manifest Generator] Error generating manifest:', err);
}
