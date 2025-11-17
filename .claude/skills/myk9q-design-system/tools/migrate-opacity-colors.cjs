/**
 * PHASE 6C: Migrate Opacity Variants to Design Tokens
 *
 * This script automatically replaces common rgba() opacity patterns
 * with design token equivalents for consistent shadows/overlays.
 *
 * Usage: node .claude/skills/myk9q-design-system/tools/migrate-opacity-colors.cjs
 */

const fs = require('fs');
const path = require('path');

// Color mappings: rgba pattern → design token
// Ordered by frequency (most common first)
const OPACITY_MAPPINGS = [
  // White overlays (for light backgrounds)
  { rgba: 'rgba(255, 255, 255, 0.1)', token: 'var(--overlay-white-subtle)', comment: 'Subtle white overlay (34x)' },
  { rgba: 'rgba(255, 255, 255, 0.8)', token: 'var(--overlay-white-heavy)', comment: 'Very strong white overlay (32x)' },
  { rgba: 'rgba(255, 255, 255, 0.2)', token: 'var(--overlay-white-light)', comment: 'Light white overlay (23x)' },
  { rgba: 'rgba(255, 255, 255, 0.3)', token: 'var(--overlay-white-moderate)', comment: 'Moderate white overlay (21x)' },
  { rgba: 'rgba(255, 255, 255, 0.6)', token: 'var(--overlay-white-strong)', comment: 'Strong white overlay (13x)' },

  // Black shadows/overlays (for dark effects)
  { rgba: 'rgba(0, 0, 0, 0.1)', token: 'var(--shadow-subtle)', comment: 'Subtle shadow (29x)' },
  { rgba: 'rgba(0, 0, 0, 0.3)', token: 'var(--shadow-medium)', comment: 'Medium shadow (26x)' },
  { rgba: 'rgba(0, 0, 0, 0.5)', token: 'var(--shadow-modal)', comment: 'Modal backdrop (19x)' },
  { rgba: 'rgba(0, 0, 0, 0.2)', token: 'var(--shadow-moderate)', comment: 'Moderate shadow (17x)' },
  { rgba: 'rgba(0, 0, 0, 0.05)', token: 'var(--shadow-barely)', comment: 'Barely visible shadow (13x)' },
  { rgba: 'rgba(0, 0, 0, 0.15)', token: 'var(--shadow-light)', comment: 'Light shadow (12x)' },

  // Status color overlays (for highlights/badges)
  { rgba: 'rgba(239, 68, 68, 0.1)', token: 'var(--overlay-error)', comment: 'Red error highlight (21x)' },
  { rgba: 'rgba(99, 102, 241, 0.1)', token: 'var(--overlay-info)', comment: 'Blue info highlight (21x)' },
  { rgba: 'rgba(16, 185, 129, 0.1)', token: 'var(--overlay-success)', comment: 'Green success highlight (13x)' },

  // Dark theme overlays
  { rgba: 'rgba(26, 29, 35, 0.8)', token: 'var(--overlay-dark-heavy)', comment: 'Dark glass morphism (22x)' },
];

// Scan and replace in CSS files
function migrateOpacityColors() {
  const srcDir = path.join(process.cwd(), 'src');
  const cssFiles = findCssFiles(srcDir);

  let totalReplacements = 0;
  const replacementLog = [];

  console.log('🎨 PHASE 6C: Migrating Opacity Variants to Design Tokens\n');
  console.log(`Found ${cssFiles.length} CSS files to process...\n`);

  cssFiles.forEach(file => {
    // Skip design-tokens.css to avoid replacing token definitions
    if (file.endsWith('design-tokens.css')) {
      return;
    }

    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    let fileReplacements = 0;

    OPACITY_MAPPINGS.forEach(({ rgba, token, comment }) => {
      // Escape special regex characters and create exact match pattern
      const escapedRgba = rgba.replace(/[().,\s]/g, '\\$&');
      // Case-insensitive match for 'rgba' keyword, exact match for rest
      const regex = new RegExp(escapedRgba.replace('rgba', '(rgba|RGBA)'), 'g');
      const matches = (newContent.match(regex) || []).length;

      if (matches > 0) {
        // Use case-insensitive replacement
        newContent = newContent.replace(new RegExp(escapedRgba, 'gi'), token);
        fileReplacements += matches;
        replacementLog.push({
          file: path.relative(process.cwd(), file),
          rgba,
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
    const groupedByRgba = groupBy(replacementLog, 'rgba');

    Object.entries(groupedByRgba).forEach(([rgba, items]) => {
      const total = items.reduce((sum, item) => sum + item.count, 0);
      const token = items[0].token;
      const comment = OPACITY_MAPPINGS.find(m => m.rgba === rgba)?.comment || '';
      console.log(`\n   ${rgba} → ${token} (${total} total)`);
      console.log(`   ${comment}`);
      items.forEach(item => {
        console.log(`      ${item.file}: ${item.count}x`);
      });
    });
  }

  console.log(`\n✅ Phase 6C Complete!`);
  console.log(`\n🎯 What This Means:`);
  console.log(`   - All common opacity patterns now use design tokens`);
  console.log(`   - Shadows and overlays adapt to theme automatically`);
  console.log(`   - Consistent visual depth across entire app`);
  console.log(`\n🔍 Next Steps:`);
  console.log(`   1. Run: npm run dev`);
  console.log(`   2. Verify shadows/overlays look correct`);
  console.log(`   3. Test dark mode to ensure overlays work well`);
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
migrateOpacityColors();
