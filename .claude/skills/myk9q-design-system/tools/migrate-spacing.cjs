#!/usr/bin/env node

/**
 * Phase 6G: Automated Spacing Migration
 *
 * Migrates off-grid spacing values to nearest design tokens:
 * - 3px → 4px (--token-space-sm)
 * - 10px → 12px (--token-space-lg)
 * - 18px → 20px (--token-space-2xl)
 * - 30px → 32px (--token-space-4xl)
 */

const fs = require('fs');
const path = require('path');

// Migration rules: oldValue → { newValue, token, context }
const MIGRATIONS = {
  '3px': { newValue: '4px', token: 'var(--token-space-sm)', contexts: ['padding', 'margin', 'gap'] },
  '10px': { newValue: '12px', token: 'var(--token-space-lg)', contexts: ['padding', 'margin', 'gap'] },
  '18px': { newValue: '20px', token: 'var(--token-space-2xl)', contexts: ['padding', 'margin', 'gap'] },
  '30px': { newValue: '32px', token: 'var(--token-space-4xl)', contexts: ['padding', 'margin', 'gap'] }
};

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

console.log('🔧 PHASE 6G: Automated Spacing Migration\n');
console.log(`Scanning ${cssFiles.length} CSS files...\n`);

let totalMigrations = 0;
const migrationsByFile = {};

cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileMigrations = 0;

  // For each migration rule
  Object.entries(MIGRATIONS).forEach(([oldValue, { newValue, token, contexts }]) => {
    // Build regex pattern for spacing properties
    const contextPattern = contexts.join('|');
    const regex = new RegExp(
      `(${contextPattern}):\\s*${oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'g'
    );

    // Count matches
    const matches = content.match(regex);
    if (matches) {
      fileMigrations += matches.length;
      totalMigrations += matches.length;

      // Replace with token
      content = content.replace(regex, `$1: ${token}`);
    }
  });

  // Write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    migrationsByFile[path.relative(process.cwd(), file)] = fileMigrations;
  }
});

console.log('═'.repeat(80));
console.log('MIGRATION RESULTS');
console.log('═'.repeat(80));
console.log();

if (Object.keys(migrationsByFile).length > 0) {
  console.log('📝 Files modified:\n');
  Object.entries(migrationsByFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      console.log(`  ${file.padEnd(60)} (${count} migrations)`);
    });
  console.log();
}

console.log(`✅ Total migrations: ${totalMigrations}`);
console.log(`📁 Files modified: ${Object.keys(migrationsByFile).length}`);
console.log();

console.log('💡 MIGRATION SUMMARY:');
console.log('   • 3px  → var(--token-space-sm)  (4px)');
console.log('   • 10px → var(--token-space-lg)  (12px)');
console.log('   • 18px → var(--token-space-2xl) (20px)');
console.log('   • 30px → var(--token-space-4xl) (32px)');
console.log();
