#!/usr/bin/env node

/**
 * Color Migration Tool
 *
 * Automatically migrates hardcoded colors to design tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color to design token mapping (based on color-analysis.json)
const COLOR_MAP = {
  // Whites and light backgrounds
  '#ffffff': 'var(--card)',
  '#fefefe': 'var(--background)',
  '#fafafa': 'var(--muted)',
  '#f9fafb': 'var(--muted)',
  '#f8f9fa': 'var(--muted)',
  '#f8fafc': 'var(--muted)',
  '#f6f6f6': 'var(--muted)',
  '#f5f5f5': 'var(--muted)',
  '#f3f4f6': 'var(--muted)',
  '#f1f5f9': 'var(--secondary)',
  '#f0f0f0': 'var(--muted)',
  '#e0f2fe': 'var(--muted)', // Light blue bg
  '#bae6fd': 'var(--border)',

  // Blacks and dark text
  '#000000': 'var(--foreground)',
  '#0a0a0a': 'var(--foreground)',
  '#111111': 'var(--foreground)',
  '#141419': 'var(--foreground)',
  '#141914': 'var(--foreground)',
  '#191414': 'var(--foreground)',
  '#1a1a1a': 'var(--card)', // Dark mode card
  '#1a1d23': 'var(--card)', // Dark mode card
  '#1e1e1e': 'var(--card)',
  '#222222': 'var(--card)',
  '#262626': 'var(--card)',
  '#282828': 'var(--card)',
  '#2a2a2a': 'var(--muted)', // Dark mode muted
  '#333333': 'var(--muted-foreground)',
  '#3a3a3a': 'var(--muted-foreground)',
  '#3c3c3c': 'var(--muted-foreground)',
  '#444444': 'var(--muted-foreground)',
  '#4a4a4a': 'var(--muted-foreground)',
  '#555555': 'var(--muted-foreground)',

  // Grays
  '#1e293b': 'var(--foreground)',
  '#1f2937': 'var(--card-foreground)',
  '#334155': 'var(--muted-foreground)',
  '#374151': 'var(--token-text-secondary)',
  '#475569': 'var(--muted-foreground)',
  '#4a5568': 'var(--border)',
  '#4b5563': 'var(--muted-foreground)',
  '#495057': 'var(--muted-foreground)',
  '#616161': 'var(--token-text-tertiary)',
  '#666666': 'var(--token-text-tertiary)',
  '#6b7280': 'var(--token-text-tertiary)',
  '#6c757d': 'var(--token-text-tertiary)',
  '#707070': 'var(--token-text-tertiary)',
  '#757575': 'var(--token-text-tertiary)',
  '#888888': 'var(--token-text-muted)',
  '#8e8e93': 'var(--apple-system-gray)',
  '#94a3b8': 'var(--token-text-muted)',
  '#95a5a6': 'var(--token-text-muted)',
  '#999999': 'var(--token-text-muted)',
  '#9ca3af': 'var(--token-text-muted)',
  '#9e9e9e': 'var(--token-text-muted)',
  '#a0a0a0': 'var(--token-text-muted)',
  '#aaaaaa': 'var(--token-text-muted)',

  // Borders
  '#bdc3c7': 'var(--border)',
  '#c0c0c0': 'var(--border)',
  '#cbd5e1': 'var(--border)',
  '#cccccc': 'var(--border)',
  '#d0d0d0': 'var(--border)',
  '#d1d5db': 'var(--border)',
  '#dee2e6': 'var(--border)',
  '#e0e0e0': 'var(--border)',
  '#e2e8f0': 'var(--border)',
  '#e5e7eb': 'var(--border)',
  '#e8e8e8': 'var(--border)',
  '#e9ecef': 'var(--border)',
  '#ecf0f1': 'var(--border)',

  // Primary Blue (#007AFF)
  '#007aff': 'var(--primary)',
  '#007bff': 'var(--primary)',
  '#0066ff': 'var(--status-in-progress)',
  '#2196f3': 'var(--primary)',
  '#2563eb': 'var(--primary)',
  '#3498db': 'var(--primary)',
  '#3b82f6': 'var(--checkin-in-ring)',
  '#60a5fa': 'var(--primary)',

  // Purple/Indigo (#5856D6 / #8b5cf6)
  '#4f46e5': 'var(--brand-purple)',
  '#5855eb': 'var(--brand-purple)',
  '#5856d6': 'var(--brand-purple)',
  '#6366f1': 'var(--checkin-at-gate)',
  '#667eea': 'var(--brand-purple)',
  '#7c3aed': 'var(--token-result-absent)',
  '#818cf8': 'var(--checkin-at-gate)',
  '#8b5cf6': 'var(--status-at-gate)',
  '#9333ea': 'var(--status-at-gate)',
  '#a855f7': 'var(--status-at-gate)',

  // Green (Success)
  '#00cc66': 'var(--status-completed)',
  '#059669': 'var(--status-checked-in)',
  '#0d9e6f': 'var(--status-checked-in)',
  '#10b981': 'var(--status-checked-in)',
  '#10b98114': 'var(--status-checked-in)',
  '#14b8a6': 'var(--status-start-time)',
  '#22c55e': 'var(--token-success)',
  '#27ae60': 'var(--token-success)',
  '#28a745': 'var(--token-success)',
  '#2ecc71': 'var(--token-success)',
  '#34c759': 'var(--success-green)',
  '#4caf50': 'var(--token-success)',
  '#d1fae5': 'var(--muted)', // Light green bg
  '#d4edda': 'var(--muted)', // Light green bg
  '#e8f5e8': 'var(--muted)', // Light green bg

  // Orange/Amber (Warning)
  '#b45309': 'var(--status-setup)',
  '#c2410c': 'var(--token-warning-contrast)',
  '#d97706': 'var(--warning-amber)',
  '#ea580c': 'var(--warning-amber)',
  '#ef6c00': 'var(--warning-amber)',
  '#f39c12': 'var(--warning-amber)',
  '#f57c00': 'var(--warning-amber)',
  '#f59e0b': 'var(--status-conflict)',
  '#f59e0b14': 'var(--status-conflict)',
  '#f97316': 'var(--checkin-conflict)',
  '#fbbf24': 'var(--warning-amber)',
  '#ff6b00': 'var(--status-briefing)',
  '#ff8e53': 'var(--warning-amber)',
  '#ff9500': 'var(--pending-orange)',
  '#ff9800': 'var(--warning-amber)',
  '#ffa500': 'var(--warning-amber)',
  '#ffa502': 'var(--warning-amber)',
  '#ffc107': 'var(--warning-amber)',
  '#fef3c7': 'var(--status-excused-bg)',
  '#fff3cd': 'var(--status-excused-bg)',

  // Red (Error/Danger)
  '#b91c1c': 'var(--token-error-contrast)',
  '#c2410c': 'var(--token-error-contrast)',
  '#c62828': 'var(--error-red)',
  '#d32f2f': 'var(--error-red)',
  '#dc2626': 'var(--token-result-nq)',
  '#dc3545': 'var(--checkin-pulled)',
  '#e74c3c': 'var(--error-red)',
  '#ec7063': 'var(--error-red)',
  '#ef4444': 'var(--status-pulled)',
  '#f44336': 'var(--error-red)',
  '#f87171': 'var(--error-red)',
  '#ff3b30': 'var(--error-red)',
  '#ff4757': 'var(--error-red)',
  '#ff5722': 'var(--error-red)',
  '#ff6b6b': 'var(--error-red)',
  '#f8d7da': 'var(--muted)', // Light red bg
  '#fecaca': 'var(--muted)', // Light red bg
  '#fee2e2': 'var(--muted)', // Light red bg
  '#ffebee': 'var(--muted)', // Light red bg

  // Magenta/Purple (#c000ff)
  '#c000ff': 'var(--status-break)',

  // Teal/Cyan
  '#14b8a6': 'var(--status-start-time)',

  // Dark backgrounds (specific colors)
  '#2c3e50': 'var(--card)',
  '#34495e': 'var(--card-foreground)',
  '#3a1e1e': 'var(--card)',
  '#3a351e': 'var(--card)',
  '#450a0a': 'var(--card)',
  '#451a1a': 'var(--card)',

  // Light blue backgrounds
  '#bfdbfe': 'var(--muted)',
  '#dbeafe': 'var(--muted)',
  '#e3f2fd': 'var(--muted)',
  '#eff6ff': 'var(--muted)',
  '#f0f9ff': 'var(--muted)',

  // Purple backgrounds
  '#ede9fe': 'var(--muted)',

  // Yellow backgrounds
  '#fff3e0': 'var(--muted)',
  '#fffbeb': 'var(--muted)',

  // Special backgrounds
  '#fafbfc': 'var(--background)',
};

// Opacity patterns that should use design tokens
const OPACITY_PATTERNS = [
  // White overlays
  { pattern: /rgba\(255,\s*255,\s*255,\s*0\.1\)/g, replacement: 'var(--glass-bg)' },
  { pattern: /rgba\(255,\s*255,\s*255,\s*0\.2\)/g, replacement: 'var(--glass-border)' },

  // Black shadows
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.1\)/g, replacement: 'var(--token-shadow-sm)' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.12\)/g, replacement: 'var(--token-shadow-md)' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.15\)/g, replacement: 'var(--token-shadow-lg)' },
];

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

// Normalize hex color
function normalizeHex(hex) {
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    // Expand 3-digit hex
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

// Migrate colors in a single file
function migrateFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  const modifications = [];

  // Skip if already using var(-- extensively
  const varCount = (content.match(/var\(--/g) || []).length;
  const hexCount = (content.match(/#[0-9a-fA-F]{3,6}\b/g) || []).length;
  const rgbaCount = (content.match(/rgba?\(/g) || []).length;

  if (varCount > (hexCount + rgbaCount) * 0.8) {
    // File already mostly uses design tokens
    return { changes: 0, modifications: [] };
  }

  // Migrate opacity patterns first (they're more specific)
  OPACITY_PATTERNS.forEach(({ pattern, replacement }) => {
    const originalContent = content;
    content = content.replace(pattern, replacement);
    if (content !== originalContent) {
      changes++;
      modifications.push({
        type: 'opacity-pattern',
        from: pattern.toString(),
        to: replacement,
      });
    }
  });

  // Migrate solid colors
  Object.entries(COLOR_MAP).forEach(([hexColor, token]) => {
    // Create regex for this color (case-insensitive, word boundary)
    const escapedHex = hexColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hexPattern = new RegExp(`${escapedHex}\\b`, 'gi');

    // Don't replace if it's already in a var()
    const lines = content.split('\n');
    let newLines = [];
    let lineChanges = false;

    lines.forEach((line, index) => {
      // Skip lines that already have this token
      if (line.includes(token)) {
        newLines.push(line);
        return;
      }

      // Skip lines with var(-- (already using design tokens)
      if (line.includes('var(--')) {
        newLines.push(line);
        return;
      }

      const originalLine = line;
      const newLine = line.replace(hexPattern, token);

      if (newLine !== originalLine) {
        changes++;
        lineChanges = true;
        modifications.push({
          type: 'color',
          line: index + 1,
          from: hexColor,
          to: token,
          context: originalLine.trim(),
        });
      }

      newLines.push(newLine);
    });

    if (lineChanges) {
      content = newLines.join('\n');
    }
  });

  // Write back to file (if not dry run)
  if (!dryRun && changes > 0) {
    // Create backup
    fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
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
  console.log('\n🎨 Color Migration Report\n');
  console.log('='.repeat(80));
  console.log(`\nMode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (files modified)'}\n`);

  if (results.length === 0) {
    console.log('\n✅ No colors to migrate! All files already use design tokens.\n');
    return;
  }

  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);

  console.log(`\n📊 Summary:\n`);
  console.log(`  Files modified: ${results.length}`);
  console.log(`  Total color replacements: ${totalChanges}`);

  console.log(`\n📁 Files:\n`);

  results.forEach(({ file, changes, modifications }) => {
    console.log(`\n  ${file} (${changes} changes)`);
    modifications.slice(0, 5).forEach(mod => {
      if (mod.type === 'color') {
        console.log(`    Line ${mod.line}: ${mod.from} → ${mod.to}`);
      } else {
        console.log(`    ${mod.from} → ${mod.to}`);
      }
    });
    if (modifications.length > 5) {
      console.log(`    ... and ${modifications.length - 5} more`);
    }
  });

  console.log('\n' + '='.repeat(80));

  if (dryRun) {
    console.log('\n💡 This was a dry run. To apply changes, run:');
    console.log('   node migrate-colors.js --apply\n');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\n🔍 Next steps:');
    console.log('   1. Review changes with git diff');
    console.log('   2. Test theme switching (purple, orange, green, dark)');
    console.log('   3. Run audit: npm run audit:design');
    console.log('   4. Delete .backup files if everything looks good\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for hardcoded colors...\n`);

const ignoreRules = loadIgnoreRules();
const results = migrateDirectory(srcDir, ignoreRules, dryRun);
generateReport(results, dryRun);

process.exit(0);
