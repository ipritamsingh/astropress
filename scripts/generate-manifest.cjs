const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = execSync('git ls-files', { cwd: rootDir, encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter((f) => f && f !== 'src/data/projectFilesManifest.ts' && !f.startsWith('.astro/'));

const manifest = {};
for (const file of files) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    manifest[file] = fs.readFileSync(fullPath, 'utf8');
  }
}

const outputPath = path.join(rootDir, 'src/data/projectFilesManifest.ts');
const fileContent = `/**
 * Complete Project Files Manifest for AstroPress GitHub Synchronization
 * Contains all root configuration, build files, public assets, templates, and code
 */
export const projectFilesManifest: Record<string, string> = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`[Manifest Generator] Packed ${Object.keys(manifest).length} project files into src/data/projectFilesManifest.ts`);
