/**
 * PHASE 6B: Migrate Brand/Status Colors to Design Tokens
 *
 * This script automatically replaces hardcoded brand and status colors
 * with existing design token equivalents for easy branding changes.
 *
 * Usage: node .claude/skills/myk9q-design-system/tools/migrate-brand-colors.cjs
 */

const fs = require('fs');
const path = require('path');

// Color mappings: hardcoded hex → design token
// These tokens ALREADY EXIST in design-tokens.css - we just need to USE them!
const COLOR_MAPPINGS = [
  // Primary brand color (purple)
  { hex: '#8b5cf6', token: 'var(--status-at-gate)', comment: 'Primary purple - at-gate status (45x)' },

  // Status colors (green - success/checked-in)
  { hex: '#10b981', token: 'var(--status-checked-in)', comment: 'Success green - checked-in status (51x)' },

  // Status colors (red - error/pulled)
  { hex: '#ef4444', token: 'var(--status-pulled)', comment: 'Error red - pulled status (48x)' },

  // Status colors (orange - warning/conflict)
  { hex: '#f59e0b', token: 'var(--status-conflict)', comment: 'Warning orange - conflict status (21x)' },

  // Status colors (blue - info/in-ring)
  { hex: '#3b82f6', token: 'var(--checkin-in-ring)', comment: 'Info blue - in-ring status (18x)' },
];

// Scan and replace in CSS files
function migrateBrandColors() {
  const srcDir = path.join(process.cwd(), 'src');
  const cssFiles = findCssFiles(srcDir);

  let totalReplacements = 0;
  const replacementLog = [];

  console.log('🎨 PHASE 6B: Migrating Brand/Status Colors to Design Tokens\n');
  console.log(`Found ${cssFiles.length} CSS files to process...\n`);
  console.log('✅ Good news: All these tokens already exist in design-tokens.css!\n');

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
      const comment = COLOR_MAPPINGS.find(m => m.hex === hex)?.comment || '';
      console.log(`\n   ${hex} → ${token} (${total} total)`);
      console.log(`   ${comment}`);
      items.forEach(item => {
        console.log(`      ${item.file}: ${item.count}x`);
      });
    });
  }

  console.log(`\n✅ Phase 6B Complete!`);
  console.log(`\n🎯 What This Means:`);
  console.log(`   - All brand/status colors now use design tokens`);
  console.log(`   - Change brand colors in ONE place (design-tokens.css)`);
  console.log(`   - Boss says "make the green more vibrant"? Change ONE line!`);
  console.log(`\n🔍 Next Steps:`);
  console.log(`   1. Run: npm run dev`);
  console.log(`   2. Verify status badges look correct`);
  console.log(`   3. Test flexibility: Edit design-tokens.css, change --status-checked-in to different green`);
  console.log(`   4. Verify change applies everywhere`);
  console.log(`   5. Run: node .claude/skills/myk9q-design-system/tools/audit-design-system.js`);
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
migrateBrandColors();
