#!/usr/bin/env node

/**
 * Phase 6F: Analyze Remaining Color Violations
 *
 * Analyzes remaining rgba() color patterns after Phase 6C
 * to identify candidates for additional opacity tokens
 */

const fs = require('fs');
const path = require('path');

// Get all CSS files in src/
const srcDir = path.join(process.cwd(), 'src');

function getAllCssFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllCssFiles(fullPath));
    } else if (item.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

const cssFiles = getAllCssFiles(srcDir);

// Pattern to match rgba() values
const rgbaPattern = /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi;

const rgbaCounts = {};

console.log('🎨 PHASE 6F: Analyzing Remaining Color Violations\n');
console.log(`Scanning ${cssFiles.length} CSS files...\n`);

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;

  while ((match = rgbaPattern.exec(content)) !== null) {
    const [fullMatch, r, g, b, a] = match;
    const normalized = `rgba(${r}, ${g}, ${b}, ${a})`;

    if (!rgbaCounts[normalized]) {
      rgbaCounts[normalized] = {
        count: 0,
        files: new Set()
      };
    }

    rgbaCounts[normalized].count++;
    rgbaCounts[normalized].files.add(path.relative(process.cwd(), file));
  }
});

// Convert to array and sort by count
const sortedRgba = Object.entries(rgbaCounts)
  .map(([rgba, data]) => ({
    rgba,
    count: data.count,
    files: Array.from(data.files)
  }))
  .sort((a, b) => b.count - a.count);

console.log('═'.repeat(80));
console.log('REMAINING RGBA() PATTERNS (sorted by frequency)');
console.log('═'.repeat(80));
console.log();

// Group by base color
const blackVariants = sortedRgba.filter(x => x.rgba.startsWith('rgba(0, 0, 0,'));
const whiteVariants = sortedRgba.filter(x => x.rgba.startsWith('rgba(255, 255, 255,'));
const colorVariants = sortedRgba.filter(x =>
  !x.rgba.startsWith('rgba(0, 0, 0,') &&
  !x.rgba.startsWith('rgba(255, 255, 255,')
);

console.log('📦 BLACK VARIANTS (shadows/overlays)\n');
blackVariants.forEach(({ rgba, count, files }) => {
  console.log(`  ${rgba.padEnd(30)} (${count}x)`);
  if (count <= 5) {
    console.log(`    → ${files.join(', ')}`);
  }
});

console.log('\n📦 WHITE VARIANTS (overlays/highlights)\n');
whiteVariants.forEach(({ rgba, count, files }) => {
  console.log(`  ${rgba.padEnd(30)} (${count}x)`);
  if (count <= 5) {
    console.log(`    → ${files.join(', ')}`);
  }
});

console.log('\n📦 COLOR VARIANTS (status/theme overlays)\n');
colorVariants.forEach(({ rgba, count, files }) => {
  console.log(`  ${rgba.padEnd(30)} (${count}x)`);
  if (count <= 5) {
    console.log(`    → ${files.join(', ')}`);
  }
});

console.log('\n' + '═'.repeat(80));
console.log('SUMMARY');
console.log('═'.repeat(80));
console.log();
console.log(`Total unique rgba() patterns: ${sortedRgba.length}`);
console.log(`Total instances: ${sortedRgba.reduce((sum, x) => sum + x.count, 0)}`);
console.log();
console.log(`Black variants: ${blackVariants.length} patterns, ${blackVariants.reduce((sum, x) => sum + x.count, 0)} instances`);
console.log(`White variants: ${whiteVariants.length} patterns, ${whiteVariants.reduce((sum, x) => sum + x.count, 0)} instances`);
console.log(`Color variants: ${colorVariants.length} patterns, ${colorVariants.reduce((sum, x) => sum + x.count, 0)} instances`);
console.log();

// Identify candidates for new tokens (used 5+ times)
const candidates = sortedRgba.filter(x => x.count >= 5);
console.log('💡 CANDIDATES FOR NEW TOKENS (5+ occurrences):');
console.log();
candidates.forEach(({ rgba, count }) => {
  const [, r, g, b, a] = rgba.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
  let suggestion = '';

  if (r === '0' && g === '0' && b === '0') {
    suggestion = `--shadow-opacity-${a.replace('.', '')}`;
  } else if (r === '255' && g === '255' && b === '255') {
    suggestion = `--overlay-white-opacity-${a.replace('.', '')}`;
  } else {
    suggestion = `--overlay-rgb${r}-${g}-${b}-${a.replace('.', '')}`;
  }

  console.log(`  ${rgba.padEnd(30)} (${count}x) → ${suggestion}`);
});

console.log();
