/**
 * PHASE 6A: Migrate Theme-Critical Colors to Design Tokens
 *
 * This script automatically replaces the top 20 most common hardcoded grays
 * with design token equivalents for theme switching support.
 *
 * Usage: node .claude/skills/myk9q-design-system/tools/migrate-theme-colors.cjs
 */

const fs = require('fs');
const path = require('path');

// Color mappings: hardcoded hex → design token
// Ordered by frequency (most common first)
const COLOR_MAPPINGS = [
  // Light theme grays/neutrals
  { hex: '#e5e7eb', token: 'var(--border-subtle)', comment: 'Light border gray (17x)' },
  { hex: '#f3f4f6', token: 'var(--surface-subtle)', comment: 'Very light surface (12x)' },
  { hex: '#e0e0e0', token: 'var(--border-light)', comment: 'Light border (8x)' },
  { hex: '#f0f0f0', token: 'var(--surface-muted)', comment: 'Light surface (7x)' },
  { hex: '#f8f9fa', token: 'var(--background-soft)', comment: 'Subtle background (6x)' },
  { hex: '#f8fafc', token: 'var(--background-subtle)', comment: 'Lightest surface (6x)' },
  { hex: '#f5f5f5', token: 'var(--surface-muted)', comment: 'Light subtle surface (4x)' },
  { hex: '#fefefe', token: 'var(--background)', comment: 'Almost white background (4x)' },
  { hex: '#f1f5f9', token: 'var(--surface)', comment: 'Light secondary surface (4x)' },
  { hex: '#6b7280', token: 'var(--text-gray)', comment: 'Gray text/muted (24x)' },
  { hex: '#9ca3af', token: 'var(--text-light-gray)', comment: 'Light gray text (12x)' },
  { hex: '#374151', token: 'var(--foreground-muted)', comment: 'Muted foreground (6x)' },

  // Dark theme grays/neutrals
  { hex: '#2a2a2a', token: 'var(--surface)', comment: 'Dark surface (15x)' },
  { hex: '#1a1a1a', token: 'var(--surface-muted)', comment: 'Very dark background (12x)' },
  { hex: '#1f2937', token: 'var(--background-subtle)', comment: 'Dark surface elevated (9x)' },
  { hex: '#1e293b', token: 'var(--foreground-dark)', comment: 'Dark foreground (7x)' },
  { hex: '#1a1d23', token: 'var(--card)', comment: 'Dark card background (7x)' },
  { hex: '#334155', token: 'var(--background-soft)', comment: 'Medium dark gray (14x)' },
  { hex: '#34495e', token: 'var(--surface-elevated)', comment: 'Dark muted (6x)' },
  { hex: '#111827', token: 'var(--foreground)', comment: 'Very dark foreground (5x)' },
  { hex: '#3a3a3a', token: 'var(--border-light)', comment: 'Dark elevated surface (5x)' },
  { hex: '#2c3e50', token: 'var(--surface-elevated)', comment: 'Dark slate (5x)' },
  { hex: '#262626', token: 'var(--surface-subtle)', comment: 'Dark surface variant (4x)' },
];

// Scan and replace in CSS files
function migrateThemeColors() {
  const srcDir = path.join(process.cwd(), 'src');
  const cssFiles = findCssFiles(srcDir);

  let totalReplacements = 0;
  const replacementLog = [];

  console.log('🎨 PHASE 6A: Migrating Theme-Critical Colors to Design Tokens\n');
  console.log(`Found ${cssFiles.length} CSS files to process...\n`);

  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    let fileReplacements = 0;

    COLOR_MAPPINGS.forEach(({ hex, token, comment }) => {
      // Case-insensitive replacement for hex colors
      const regex = new RegExp(hex, 'gi');
      const matches = (newContent.match(regex) || []).length;

      if (matches > 0) {
        newContent = newContent.replace(regex, token);
        fileReplacements += matches;
        replacementLog.push({
          file: path.relative(process.cwd(), file),
          hex,
          token,
          count: matches
        });
      }
    });

    if (fileReplacements > 0) {
      fs.writeFileSync(file, newContent, 'utf8');
      totalReplacements += fileReplacements;
      console.log(`✅ ${path.basename(file)}: ${fileReplacements} replacements`);
    }
  });

  console.log(`\n📊 MIGRATION SUMMARY:`);
  console.log(`   Total files scanned: ${cssFiles.length}`);
  console.log(`   Total replacements: ${totalReplacements}`);

  if (replacementLog.length > 0) {
    console.log(`\n📝 DETAILED LOG:`);
    const groupedByHex = groupBy(replacementLog, 'hex');

    Object.entries(groupedByHex).forEach(([hex, items]) => {
      const total = items.reduce((sum, item) => sum + item.count, 0);
      const token = items[0].token;
      console.log(`\n   ${hex} → ${token} (${total} total)`);
      items.forEach(item => {
        console.log(`      ${item.file}: ${item.count}x`);
      });
    });
  }

  console.log(`\n✅ Phase 6A Complete!`);
  console.log(`\n🔍 Next Steps:`);
  console.log(`   1. Run: npm run dev`);
  console.log(`   2. Test light mode visually`);
  console.log(`   3. Test dark mode visually`);
  console.log(`   4. Run: node .claude/skills/myk9q-design-system/tools/audit-design-system.js`);
}

// Find all CSS files recursively
function findCssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        results = results.concat(findCssFiles(filePath));
      }
    } else if (file.endsWith('.css')) {
      results.push(filePath);
    }
  });

  return results;
}

// Group array by property
function groupBy(arr, prop) {
  return arr.reduce((acc, item) => {
    const key = item[prop];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// Run migration
migrateThemeColors();
