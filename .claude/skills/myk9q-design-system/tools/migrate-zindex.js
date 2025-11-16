#!/usr/bin/env node

/**
 * Z-Index Migration Tool
 *
 * Migrates hardcoded z-index values to design tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Z-index to design token mapping
const ZINDEX_MAP = {
  // Base layer
  '0': 'var(--token-z-base)',

  // Raised elements (tooltips, dropdowns that appear above content)
  '1': 'var(--token-z-raised)',
  '2': 'var(--token-z-raised)',
  '5': 'var(--token-z-raised)',
  '9': 'var(--token-z-raised)',
  '10': 'var(--token-z-raised)',
  '11': 'var(--token-z-raised)',
  '20': 'var(--token-z-raised)',
  '21': 'var(--token-z-raised)',
  '50': 'var(--token-z-raised)',

  // Overlays (backgrounds for modals, drawers)
  '100': 'var(--token-z-overlay)',
  '116': 'var(--token-z-overlay)',
  '300': 'var(--token-z-overlay)',
  '998': 'var(--token-z-overlay)',
  '999': 'var(--token-z-overlay)',

  // Modals and dialogs
  '1000': 'var(--token-z-modal)',
  '1001': 'var(--token-z-modal)',

  // Toasts, notifications, diagnostics (highest priority)
  '2000': 'var(--token-z-toast)',
  '9997': 'var(--token-z-toast)',
  '9998': 'var(--token-z-toast)',
  '9999': 'var(--token-z-toast)',
  '10000': 'var(--token-z-toast)',
};

// Load .auditignore rules
function loadIgnoreRules() {
  const ignorePath = path.join(__dirname, '.auditignore');
  if (!fs.existsSync(ignorePath)) return [];

  const content = fs.readFileSync(ignorePath, 'utf-8');
  const rules = [];

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const parts = line.split(':');
    if (parts.length >= 3) {
      rules.push({
        file: parts[0],
        lineOrPattern: parts[1],
        reason: parts.slice(2).join(':'),
      });
    }
  });

  return rules;
}

// Check if file should be ignored
function shouldIgnoreFile(filePath, ignoreRules) {
  const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');

  for (const rule of ignoreRules) {
    if (relativePath.includes(rule.file) && rule.lineOrPattern === '*') {
      return true;
    }
  }

  return false;
}

// Migrate z-index in a single file
function migrateFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  const modifications = [];

  // Skip if already using var(-- extensively
  const varCount = (content.match(/var\(--/g) || []).length;
  const zIndexCount = (content.match(/z-index:\s*\d+/g) || []).length;

  if (zIndexCount === 0) {
    return { changes: 0, modifications: [] };
  }

  const lines = content.split('\n');
  let newLines = [];

  lines.forEach((line, index) => {
    let newLine = line;

    // Skip lines that already use var(--
    if (line.includes('var(--token-z-')) {
      newLines.push(line);
      return;
    }

    // Find z-index declarations
    const zIndexMatch = line.match(/z-index:\s*(\d+)/);

    if (zIndexMatch) {
      const value = zIndexMatch[1];
      const token = ZINDEX_MAP[value];

      if (token) {
        newLine = line.replace(/z-index:\s*\d+/, `z-index: ${token}`);

        if (newLine !== line) {
          changes++;
          modifications.push({
            line: index + 1,
            from: `z-index: ${value}`,
            to: `z-index: ${token}`,
            context: line.trim(),
          });
        }
      }
    }

    newLines.push(newLine);
  });

  const newContent = newLines.join('\n');

  // Write back to file (if not dry run)
  if (!dryRun && changes > 0) {
    // Create backup
    fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return { changes, modifications };
}

// Recursively migrate directory
function migrateDirectory(dir, ignoreRules, dryRun = false) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        results.push(...migrateDirectory(filePath, ignoreRules, dryRun));
      }
    } else if (file.endsWith('.css')) {
      if (shouldIgnoreFile(filePath, ignoreRules)) {
        return;
      }

      const { changes, modifications } = migrateFile(filePath, dryRun);
      if (changes > 0) {
        results.push({
          file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
          changes,
          modifications: modifications.slice(0, 10), // Limit to first 10 for reporting
        });
      }
    }
  });

  return results;
}

// Generate report
function generateReport(results, dryRun) {
  console.log('\n📐 Z-Index Migration Report\n');
  console.log('='.repeat(80));
  console.log(`\nMode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (files modified)'}\n`);

  if (results.length === 0) {
    console.log('\n✅ No z-index values to migrate! All files already use design tokens.\n');
    return;
  }

  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);

  console.log(`\n📊 Summary:\n`);
  console.log(`  Files modified: ${results.length}`);
  console.log(`  Total z-index replacements: ${totalChanges}`);

  console.log(`\n📁 Files:\n`);

  results.forEach(({ file, changes, modifications }) => {
    console.log(`\n  ${file} (${changes} changes)`);
    modifications.slice(0, 5).forEach(mod => {
      console.log(`    Line ${mod.line}: ${mod.from} → ${mod.to}`);
    });
    if (modifications.length > 5) {
      console.log(`    ... and ${modifications.length - 5} more`);
    }
  });

  console.log('\n' + '='.repeat(80));

  if (dryRun) {
    console.log('\n💡 This was a dry run. To apply changes, run:');
    console.log('   node migrate-zindex.js --apply\n');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\n🔍 Next steps:');
    console.log('   1. Review changes with git diff');
    console.log('   2. Test all modals, dialogs, and overlays');
    console.log('   3. Run audit: npm run audit:design');
    console.log('   4. Delete .backup files if everything looks good\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for hardcoded z-index values...\n`);

const ignoreRules = loadIgnoreRules();
const results = migrateDirectory(srcDir, ignoreRules, dryRun);
generateReport(results, dryRun);

process.exit(0);
