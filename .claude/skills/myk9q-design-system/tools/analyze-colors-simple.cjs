#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colorMap = {};
const categoryMap = {
  'theme-critical': [],
  'brand-colors': [],
  'semantic-colors': [],
  'opacity-variants': [],
  'white-black': []
};

function categorizeColor(color) {
  const lower = color.toLowerCase();

  // White/black (always hardcoded)
  if (lower === '#ffffff' || lower === '#fff' || lower === 'rgb(255, 255, 255)') return 'white-black';
  if (lower === '#000000' || lower === '#000' || lower === 'rgb(0, 0, 0)') return 'white-black';

  // Opacity variants
  if (lower.includes('rgba')) return 'opacity-variants';

  // Common grays (theme-critical)
  if (lower.match(/#[ef][0-9a-f]{5}/) || lower.match(/#[1-3][0-9a-f]{5}/)) return 'theme-critical';

  // Brand/status colors
  if (lower.includes('10b981') || lower.includes('8b5cf6') || lower.includes('3b82f6')) return 'brand-colors';
  if (lower.includes('ec4899') || lower.includes('f59e0b') || lower.includes('ef4444')) return 'brand-colors';

  return 'semantic-colors';
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line) => {
    // Match hex colors
    const hexMatches = line.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexMatches) {
      hexMatches.forEach(color => {
        if (!line.includes('var(--')) {
          colorMap[color] = (colorMap[color] || 0) + 1;
        }
      });
    }

    // Match rgba
    const rgbaMatches = line.match(/rgba?\([^)]+\)/g);
    if (rgbaMatches) {
      rgbaMatches.forEach(color => {
        if (!line.includes('var(--')) {
          colorMap[color] = (colorMap[color] || 0) + 1;
        }
      });
    }
  });
}

function scanDir(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
      scanDir(fullPath);
    } else if (item.endsWith('.css')) {
      scanFile(fullPath);
    }
  });
}

const srcDir = path.join(process.cwd(), 'src');
console.log('Scanning:', srcDir);
scanDir(srcDir);

// Categorize colors
Object.entries(colorMap).forEach(([color, count]) => {
  const category = categorizeColor(color);
  categoryMap[category].push({ color, count });
});

// Sort each category by frequency
Object.keys(categoryMap).forEach(cat => {
  categoryMap[cat].sort((a, b) => b.count - a.count);
});

console.log('HARDCODED COLOR ANALYSIS\n');
console.log('=' .repeat(80));

console.log('\n🎨 THEME-CRITICAL COLORS (backgrounds, text, borders)');
console.log('These MUST use tokens for theme switching:');
categoryMap['theme-critical'].forEach(({ color, count }) => {
  console.log(`  ${count.toString().padStart(4)}x ${color}`);
});

console.log('\n🎯 BRAND/STATUS COLORS (primary, status indicators)');
console.log('These might change for branding:');
categoryMap['brand-colors'].forEach(({ color, count }) => {
  console.log(`  ${count.toString().padStart(4)}x ${color}`);
});

console.log('\n💧 OPACITY VARIANTS (rgba overlays, shadows)');
console.log('Need opacity token system:');
categoryMap['opacity-variants'].slice(0, 15).forEach(({ color, count }) => {
  console.log(`  ${count.toString().padStart(4)}x ${color}`);
});

console.log('\n⚪ WHITE/BLACK (always hardcoded)');
console.log('Intentional - do NOT migrate:');
categoryMap['white-black'].forEach(({ color, count }) => {
  console.log(`  ${count.toString().padStart(4)}x ${color}`);
});

console.log('\n🎨 SEMANTIC COLORS (specific UI elements)');
console.log('Intentional - document in .auditignore:');
categoryMap['semantic-colors'].slice(0, 15).forEach(({ color, count }) => {
  console.log(`  ${count.toString().padStart(4)}x ${color}`);
});

// Summary
const themeCritical = categoryMap['theme-critical'].reduce((sum, c) => sum + c.count, 0);
const brandColors = categoryMap['brand-colors'].reduce((sum, c) => sum + c.count, 0);
const opacityVariants = categoryMap['opacity-variants'].reduce((sum, c) => sum + c.count, 0);
const whiteBlack = categoryMap['white-black'].reduce((sum, c) => sum + c.count, 0);
const semantic = categoryMap['semantic-colors'].reduce((sum, c) => sum + c.count, 0);

console.log('\n' + '='.repeat(80));
console.log('\n📊 SUMMARY:');
console.log(`  Theme-Critical:  ${themeCritical.toString().padStart(4)} violations (HIGH PRIORITY)`);
console.log(`  Brand/Status:    ${brandColors.toString().padStart(4)} violations (MEDIUM PRIORITY)`);
console.log(`  Opacity Variants: ${opacityVariants.toString().padStart(4)} violations (MEDIUM PRIORITY)`);
console.log(`  White/Black:     ${whiteBlack.toString().padStart(4)} violations (SKIP - intentional)`);
console.log(`  Semantic:        ${semantic.toString().padStart(4)} violations (SKIP - intentional)`);
console.log(`  ───────────────────────────`);
console.log(`  Total:           ${(themeCritical + brandColors + opacityVariants + whiteBlack + semantic).toString().padStart(4)} violations`);

console.log('\n✅ RECOMMENDED PHASE 6 SCOPE:');
console.log(`   Migrate ~${themeCritical + brandColors + opacityVariants} violations (Theme + Brand + Opacity)`);
console.log(`   Skip ~${whiteBlack + semantic} violations (White/Black + Semantic)`);
