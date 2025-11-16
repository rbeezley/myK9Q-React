#!/usr/bin/env node

/**
 * myK9Q Design System Audit Tool
 *
 * Scans the codebase for design system violations:
 * - Hardcoded colors (not using CSS variables)
 * - Hardcoded spacing (not using design tokens)
 * - Multiple media query blocks per breakpoint
 * - Use of !important (except in utilities.css)
 * - Hardcoded z-index values
 * - Non-standard breakpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .auditignore file
function loadIgnoreRules() {
  const ignorePath = path.join(__dirname, '.auditignore');
  if (!fs.existsSync(ignorePath)) {
    return [];
  }

  const content = fs.readFileSync(ignorePath, 'utf-8');
  const rules = [];

  content.split('\n').forEach(line => {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;

    // Format: filename:line-or-pattern:reason
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

// Check if violation should be ignored
function shouldIgnoreViolation(filePath, line, type, ignoreRules) {
  const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');

  for (const rule of ignoreRules) {
    // Check if file matches
    if (!relativePath.includes(rule.file)) continue;

    // Check if line matches
    if (rule.lineOrPattern === '*') return true; // Ignore entire file
    if (rule.lineOrPattern === type) return true; // Ignore all instances of violation type
    if (rule.lineOrPattern === String(line)) return true; // Ignore specific line

  }

  return false;
}

const ignoreRules = loadIgnoreRules();

// Regex patterns for violations
const PATTERNS = {
  // Hardcoded colors (hex codes, rgb, rgba)
  hardcodedColors: /(?:background|color|border|border-color|box-shadow|fill|stroke|outline):\s*(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g,

  // Hardcoded spacing (px, rem values not in variables)
  hardcodedSpacing: /(?:padding|margin|gap|width|height|top|left|right|bottom):\s*(?:\d+(?:\.\d+)?(?:px|rem))/g,

  // !important usage
  important: /!important/g,

  // Hardcoded z-index
  hardcodedZIndex: /z-index:\s*\d+/g,

  // Non-standard breakpoints
  nonStandardBreakpoints: /@media\s*\([^)]*(?:min-width|max-width):\s*(?!640px|1024px|1440px)[^)]+\)/g,

  // Desktop-first approach (max-width instead of min-width)
  desktopFirst: /@media\s*\([^)]*max-width/g,

  // Utility-first class names (Tailwind-style)
  utilityClasses: /class(?:Name)?=["'](?:[^"']*\b(?:flex|grid|p-\d+|m-\d+|text-\d+|bg-\w+|w-\d+|h-\d+)\b)/g,
};

// Allowed exceptions
const EXCEPTIONS = {
  colors: [
    'transparent',
    'currentColor',
    'inherit',
    'initial',
    'unset',
    'white', // Allowed for specific cases
  ],
  spacing: [
    '0',
    '100%',
    'auto',
    'inherit',
    'initial',
  ],
  files: {
    important: ['utilities.css'], // !important allowed here
    hardcodedColors: ['design-tokens.css'], // Token definitions
    hardcodedSpacing: ['design-tokens.css'],
  },
};

// Scan a single file
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const violations = [];

  // Check for hardcoded colors
  if (!EXCEPTIONS.files.hardcodedColors.includes(fileName)) {
    let match;
    const colorPattern = new RegExp(PATTERNS.hardcodedColors);
    while ((match = colorPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const snippet = match[0];

      // Skip if it's a CSS variable definition or should be ignored
      if (!snippet.includes('var(--') && !shouldIgnoreViolation(filePath, line, 'hardcoded-color', ignoreRules)) {
        violations.push({
          type: 'hardcoded-color',
          line,
          snippet,
          message: 'Use CSS variable (e.g., var(--foreground)) instead of hardcoded color',
        });
      }
    }
  }

  // Check for hardcoded spacing
  if (!EXCEPTIONS.files.hardcodedSpacing.includes(fileName)) {
    let match;
    const spacingPattern = new RegExp(PATTERNS.hardcodedSpacing);
    while ((match = spacingPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const snippet = match[0];

      // Skip if it's a CSS variable definition, an exception, or should be ignored
      if (!snippet.includes('var(--') && !EXCEPTIONS.spacing.some(ex => snippet.includes(ex)) && !shouldIgnoreViolation(filePath, line, 'hardcoded-spacing', ignoreRules)) {
        violations.push({
          type: 'hardcoded-spacing',
          line,
          snippet,
          message: 'Use design token (e.g., var(--token-space-lg)) instead of hardcoded value',
        });
      }
    }
  }

  // Check for !important usage
  if (!EXCEPTIONS.files.important.includes(fileName)) {
    let match;
    const importantPattern = new RegExp(PATTERNS.important);
    while ((match = importantPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      if (!shouldIgnoreViolation(filePath, line, 'important-usage', ignoreRules)) {
        violations.push({
          type: 'important-usage',
          line,
          snippet: '!important',
          message: 'Avoid !important - use proper CSS specificity instead',
        });
      }
    }
  }

  // Check for hardcoded z-index
  let match;
  const zIndexPattern = new RegExp(PATTERNS.hardcodedZIndex);
  while ((match = zIndexPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const snippet = match[0];

    if (!snippet.includes('var(--') && !shouldIgnoreViolation(filePath, line, 'hardcoded-z-index', ignoreRules)) {
      violations.push({
        type: 'hardcoded-z-index',
        line,
        snippet,
        message: 'Use z-index token (e.g., var(--token-z-modal)) instead of hardcoded value',
      });
    }
  }

  // Check for non-standard breakpoints
  const breakpointPattern = new RegExp(PATTERNS.nonStandardBreakpoints);
  while ((match = breakpointPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const snippet = match[0];
    if (!shouldIgnoreViolation(filePath, line, 'non-standard-breakpoint', ignoreRules)) {
      violations.push({
        type: 'non-standard-breakpoint',
        line,
        snippet,
        message: 'Use standard breakpoints: 640px, 1024px, or 1440px',
      });
    }
  }

  // Check for desktop-first approach
  const desktopFirstPattern = new RegExp(PATTERNS.desktopFirst);
  while ((match = desktopFirstPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const snippet = match[0];
    if (!shouldIgnoreViolation(filePath, line, 'desktop-first', ignoreRules)) {
      violations.push({
        type: 'desktop-first',
        line,
        snippet,
        message: 'Use mobile-first approach with min-width instead of max-width',
      });
    }
  }

  // Check for multiple media query blocks for same breakpoint
  const breakpoints = ['640px', '1024px', '1440px'];
  breakpoints.forEach(bp => {
    const regex = new RegExp(`@media\\s*\\([^)]*${bp.replace('.', '\\.')}`, 'g');
    const matches = content.match(regex);
    if (matches && matches.length > 1) {
      violations.push({
        type: 'duplicate-media-query',
        line: 0, // Can't easily determine line for this
        snippet: `@media (min-width: ${bp})`,
        message: `Multiple media query blocks for ${bp} - consolidate into one block`,
      });
    }
  });

  return violations;
}

// Recursively scan directory
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.css')) {
      const violations = scanFile(filePath);
      if (violations.length > 0) {
        results.push({
          file: filePath,
          violations,
        });
      }
    }
  });

  return results;
}

// Generate report
function generateReport(results) {
  console.log('\n🎨 myK9Q Design System Audit Report\n');
  console.log('=' .repeat(80));

  if (results.length === 0) {
    console.log('\n✅ No violations found! Your codebase is compliant with the design system.\n');
    return;
  }

  const violationCounts = {
    'hardcoded-color': 0,
    'hardcoded-spacing': 0,
    'important-usage': 0,
    'hardcoded-z-index': 0,
    'non-standard-breakpoint': 0,
    'desktop-first': 0,
    'duplicate-media-query': 0,
  };

  results.forEach(({ file, violations }) => {
    console.log(`\n📁 ${file.replace(process.cwd(), '')}`);
    console.log('-'.repeat(80));

    violations.forEach(v => {
      violationCounts[v.type]++;
      console.log(`  Line ${v.line}: ${v.message}`);
      console.log(`  ${v.snippet}`);
      console.log('');
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');
  Object.entries(violationCounts).forEach(([type, count]) => {
    if (count > 0) {
      const emoji = count > 10 ? '🔴' : count > 5 ? '🟡' : '🟢';
      console.log(`  ${emoji} ${type}: ${count}`);
    }
  });

  const total = Object.values(violationCounts).reduce((a, b) => a + b, 0);
  console.log(`\n  Total violations: ${total}\n`);
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for design system violations...\n`);

const results = scanDirectory(srcDir);
generateReport(results);

process.exit(results.length > 0 ? 1 : 0);
