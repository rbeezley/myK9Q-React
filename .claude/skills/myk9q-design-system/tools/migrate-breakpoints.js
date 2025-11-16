#!/usr/bin/env node

/**
 * Breakpoint Migration Tool
 *
 * Migrates non-standard breakpoints and desktop-first approach to mobile-first
 *
 * Standard Breakpoints:
 * - Mobile: < 640px (base styles, no media query)
 * - Tablet: @media (min-width: 640px)
 * - Desktop: @media (min-width: 1024px)
 * - Large: @media (min-width: 1440px)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Breakpoint mapping (non-standard → standard)
const BREAKPOINT_MAP = {
  // Mobile breakpoints → 640px (tablet)
  '360px': '640px',
  '375px': '640px',
  '380px': '640px',
  '390px': '640px',
  '480px': '640px',
  '481px': '640px',
  '641px': '640px', // Off-by-one

  // Tablet breakpoints → 640px or 1024px
  '768px': '640px',  // Most 768px should be 640px
  '769px': '1024px',

  // Desktop breakpoints → 1024px
  '1025px': '1024px', // Off-by-one
  '1200px': '1024px',
  '1400px': '1440px',
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

// Migrate breakpoints in a single file
function migrateFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  const modifications = [];

  const lines = content.split('\n');
  let newLines = [];

  lines.forEach((line, index) => {
    let newLine = line;
    let lineChanged = false;

    // Skip lines that are already standard
    if (line.match(/@media\s*\(\s*min-width:\s*(640px|1024px|1440px)\s*\)/)) {
      newLines.push(line);
      return;
    }

    // Fix 1: Non-standard breakpoints (replace with standard)
    Object.entries(BREAKPOINT_MAP).forEach(([oldBp, newBp]) => {
      const regex = new RegExp(`(min-width|max-width):\\s*${oldBp.replace('.', '\\.')}`, 'g');
      if (regex.test(newLine)) {
        const before = newLine;
        newLine = newLine.replace(regex, `$1: ${newBp}`);
        if (newLine !== before) {
          lineChanged = true;
          modifications.push({
            type: 'non-standard-breakpoint',
            line: index + 1,
            from: `${oldBp}`,
            to: `${newBp}`,
            context: before.trim(),
          });
        }
      }
    });

    // Fix 2: Desktop-first → Mobile-first (max-width → min-width)
    // This is more complex and requires manual review in most cases
    // We'll only auto-fix simple cases
    const maxWidthMatch = newLine.match(/@media\s*\(\s*max-width:\s*(640px|1024px|1440px)\s*\)/);
    if (maxWidthMatch) {
      const breakpoint = maxWidthMatch[1];
      // For standard breakpoints with max-width, we can note it but not auto-fix
      // because it requires inverting the CSS logic
      modifications.push({
        type: 'desktop-first',
        line: index + 1,
        from: `max-width: ${breakpoint}`,
        to: `MANUAL REVIEW: Consider mobile-first with min-width`,
        context: newLine.trim(),
      });
    }

    if (lineChanged) {
      changes++;
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
      if (changes > 0 || modifications.length > 0) {
        results.push({
          file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
          changes,
          modifications: modifications.slice(0, 15), // Limit for reporting
        });
      }
    }
  });

  return results;
}

// Generate report
function generateReport(results, dryRun) {
  console.log('\n📱 Breakpoint Migration Report\n');
  console.log('='.repeat(80));
  console.log(`\nMode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (files modified)'}\n`);

  if (results.length === 0) {
    console.log('\n✅ No breakpoints to migrate! All files use standard breakpoints.\n');
    return;
  }

  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
  const totalModifications = results.reduce((sum, r) => sum + r.modifications.length, 0);

  // Count by type
  const byType = {};
  results.forEach(({ modifications }) => {
    modifications.forEach(mod => {
      byType[mod.type] = (byType[mod.type] || 0) + 1;
    });
  });

  console.log(`\n📊 Summary:\n`);
  console.log(`  Files affected: ${results.length}`);
  console.log(`  Breakpoint changes applied: ${totalChanges}`);
  console.log(`  Desktop-first flagged for review: ${byType['desktop-first'] || 0}`);
  console.log(`  Non-standard breakpoints fixed: ${byType['non-standard-breakpoint'] || 0}`);

  console.log(`\n📁 Files (showing first 20):\n`);

  results.slice(0, 20).forEach(({ file, changes, modifications }) => {
    console.log(`\n  ${file} (${changes} automated fixes)`);

    const breakpointFixes = modifications.filter(m => m.type === 'non-standard-breakpoint').slice(0, 3);
    const desktopFirst = modifications.filter(m => m.type === 'desktop-first').slice(0, 2);

    if (breakpointFixes.length > 0) {
      console.log(`    Breakpoint fixes:`);
      breakpointFixes.forEach(mod => {
        console.log(`      Line ${mod.line}: ${mod.from} → ${mod.to}`);
      });
    }

    if (desktopFirst.length > 0) {
      console.log(`    ⚠️  Desktop-first (manual review needed):`);
      desktopFirst.forEach(mod => {
        console.log(`      Line ${mod.line}: ${mod.from}`);
      });
    }

    if (modifications.length > 5) {
      console.log(`    ... and ${modifications.length - 5} more`);
    }
  });

  if (results.length > 20) {
    console.log(`\n  ... and ${results.length - 20} more files`);
  }

  console.log('\n' + '='.repeat(80));

  if (dryRun) {
    console.log('\n💡 This was a dry run. To apply changes, run:');
    console.log('   node migrate-breakpoints.js --apply\n');
  } else {
    console.log('\n✅ Automated migration complete!');
    console.log('\n⚠️  Manual Review Required:');
    console.log(`   ${byType['desktop-first'] || 0} desktop-first media queries need logic inversion`);
    console.log('   These use max-width and need to be rewritten with min-width');
    console.log('   See files above marked with "MANUAL REVIEW"');
    console.log('\n🔍 Next steps:');
    console.log('   1. Review changes with git diff');
    console.log('   2. Manually fix desktop-first queries (invert CSS logic)');
    console.log('   3. Test at 375px, 768px, 1024px, 1440px');
    console.log('   4. Run audit: npm run audit:design');
    console.log('   5. Delete .backup files if everything looks good\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for non-standard breakpoints...\n`);

const ignoreRules = loadIgnoreRules();
const results = migrateDirectory(srcDir, ignoreRules, dryRun);
generateReport(results, dryRun);

process.exit(0);
