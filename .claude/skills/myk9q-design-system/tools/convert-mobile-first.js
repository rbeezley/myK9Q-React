#!/usr/bin/env node

/**
 * Desktop-First to Mobile-First Conversion Tool
 *
 * Converts desktop-first media queries (max-width) to mobile-first (min-width)
 * by inverting the CSS logic: mobile styles become base, desktop becomes enhancement.
 *
 * IMPORTANT: This tool performs logic inversion, which is complex and risky.
 * Always run in dry-run mode first and manually review changes.
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

// Breakpoint mapping for inversion
const BREAKPOINT_INVERSION = {
  '640px': { newBreakpoint: '640px', type: 'tablet' },
  '1024px': { newBreakpoint: '1024px', type: 'desktop' },
  '1440px': { newBreakpoint: '1440px', type: 'large' },
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

// Parse CSS and identify desktop-first patterns
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const desktopFirstBlocks = [];

  let inMediaQuery = false;
  let currentBlock = null;
  let braceDepth = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Detect max-width media query (desktop-first)
    const maxWidthMatch = trimmed.match(/@media\s*\(\s*max-width:\s*(\d+px)\s*\)/);
    if (maxWidthMatch && !inMediaQuery) {
      const breakpoint = maxWidthMatch[1];

      // Only process standard breakpoints
      if (BREAKPOINT_INVERSION[breakpoint]) {
        currentBlock = {
          breakpoint,
          startLine: index + 1,
          endLine: -1,
          originalQuery: maxWidthMatch[0],
          rules: [],
          rawLines: [],
        };
        inMediaQuery = true;
        braceDepth = 0;
      }
    } else if (inMediaQuery && currentBlock) {
      currentBlock.rawLines.push(line);

      // Track brace depth
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Extract CSS rules
      if (trimmed && !trimmed.startsWith('@media') && trimmed !== '{' && trimmed !== '}') {
        currentBlock.rules.push(line);
      }

      // Media query ends when braces balance
      if (braceDepth === 0 && closeBraces > 0) {
        currentBlock.endLine = index + 1;
        desktopFirstBlocks.push(currentBlock);
        currentBlock = null;
        inMediaQuery = false;
      }
    }
  });

  return {
    content,
    lines,
    desktopFirstBlocks,
  };
}

// Find base styles that correspond to a media query
function findBaseStyles(lines, mediaBlock, allMediaBlocks) {
  const baseStyles = [];
  const selectors = new Set();

  // Extract selectors from media query
  mediaBlock.rules.forEach(rule => {
    const selectorMatch = rule.match(/^(\s*)([.#[\w-]+(?:\s*[>+~]\s*[.#[\w-]+)*)\s*{?/);
    if (selectorMatch) {
      selectors.add(selectorMatch[2].trim());
    }
  });

  // Search for matching selectors in base styles (before any media query)
  const firstMediaLine = Math.min(...allMediaBlocks.map(b => b.startLine));

  for (let i = 0; i < firstMediaLine - 1; i++) {
    const line = lines[i];
    selectors.forEach(selector => {
      if (line.includes(selector) && line.includes('{')) {
        // Found a base style for this selector
        baseStyles.push({
          line: i + 1,
          selector,
          content: line,
        });
      }
    });
  }

  return baseStyles;
}

// Generate conversion report for manual review
function generateConversionPlan(filePath, analysis) {
  const { desktopFirstBlocks, lines } = analysis;

  if (desktopFirstBlocks.length === 0) {
    return null;
  }

  const conversions = [];

  desktopFirstBlocks.forEach(block => {
    const baseStyles = findBaseStyles(lines, block, desktopFirstBlocks);
    const inversionInfo = BREAKPOINT_INVERSION[block.breakpoint];

    conversions.push({
      originalBreakpoint: block.breakpoint,
      newBreakpoint: inversionInfo.newBreakpoint,
      type: inversionInfo.type,
      lineRange: `${block.startLine}-${block.endLine}`,
      ruleCount: block.rules.length,
      baseStylesFound: baseStyles.length,
      preview: {
        before: block.rawLines.slice(0, 5).map(l => l.trim()).join('\n'),
        recommendation: `Convert to @media (min-width: ${inversionInfo.newBreakpoint})`,
      },
    });
  });

  return {
    file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
    desktopFirstCount: desktopFirstBlocks.length,
    conversions,
  };
}

// Scan directory for desktop-first patterns
function scanDirectory(dir, ignoreRules) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        results.push(...scanDirectory(filePath, ignoreRules));
      }
    } else if (file.endsWith('.css')) {
      if (shouldIgnoreFile(filePath, ignoreRules)) {
        return;
      }

      const analysis = analyzeFile(filePath);
      const plan = generateConversionPlan(filePath, analysis);

      if (plan) {
        results.push(plan);
      }
    }
  });

  return results;
}

// Generate detailed report
function generateReport(results) {
  console.log('\n📱 Desktop-First to Mobile-First Conversion Analysis\n');
  console.log('='.repeat(80));

  if (results.length === 0) {
    console.log('\n✅ No desktop-first media queries found! All files use mobile-first.\n');
    return;
  }

  const totalConversions = results.reduce((sum, r) => sum + r.desktopFirstCount, 0);

  console.log(`\n📊 Summary:\n`);
  console.log(`  Files with desktop-first queries: ${results.length}`);
  console.log(`  Total desktop-first blocks: ${totalConversions}`);

  // Group by breakpoint
  const byBreakpoint = {};
  results.forEach(({ conversions }) => {
    conversions.forEach(c => {
      byBreakpoint[c.originalBreakpoint] = (byBreakpoint[c.originalBreakpoint] || 0) + 1;
    });
  });

  console.log(`\n📏 By Breakpoint:\n`);
  Object.entries(byBreakpoint).forEach(([bp, count]) => {
    console.log(`  max-width: ${bp} → min-width: ${bp} (${count} blocks)`);
  });

  console.log(`\n📁 Files Requiring Conversion:\n`);

  results.slice(0, 20).forEach(({ file, desktopFirstCount, conversions }) => {
    console.log(`\n  ${file} (${desktopFirstCount} blocks)`);

    conversions.slice(0, 3).forEach(c => {
      console.log(`    Line ${c.lineRange}: ${c.originalBreakpoint} (${c.ruleCount} rules, ${c.baseStylesFound} base styles found)`);
      console.log(`      → Convert to: @media (min-width: ${c.newBreakpoint})`);
    });

    if (conversions.length > 3) {
      console.log(`    ... and ${conversions.length - 3} more blocks`);
    }
  });

  if (results.length > 20) {
    console.log(`\n  ... and ${results.length - 20} more files`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Desktop-First Conversion Requires Manual Review\n');
  console.log('This tool has identified desktop-first patterns, but conversion requires:');
  console.log('  1. Understanding the CSS logic for each component');
  console.log('  2. Inverting mobile/desktop styles (base ↔ media query)');
  console.log('  3. Testing at all breakpoints to ensure no regressions\n');
  console.log('Recommended approach:');
  console.log('  1. Start with files that have the fewest blocks (easier to verify)');
  console.log('  2. Convert one file at a time');
  console.log('  3. Test thoroughly at 375px, 640px, 1024px, 1440px');
  console.log('  4. Commit each file individually for easy rollback\n');
  console.log('Example manual conversion pattern:');
  console.log('  BEFORE (Desktop-First):');
  console.log('    .button { padding: 16px; }  /* Desktop default */');
  console.log('    @media (max-width: 640px) {');
  console.log('      .button { padding: 8px; }  /* Mobile override */');
  console.log('    }\n');
  console.log('  AFTER (Mobile-First):');
  console.log('    .button { padding: 8px; }   /* Mobile default */');
  console.log('    @media (min-width: 640px) {');
  console.log('      .button { padding: 16px; } /* Desktop enhancement */');
  console.log('    }\n');

  // Save detailed JSON report
  const outputPath = path.join(__dirname, 'desktop-first-conversion-plan.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      filesAffected: results.length,
      totalConversions,
      byBreakpoint,
      timestamp: new Date().toISOString(),
    },
    files: results,
  }, null, 2));

  console.log(`📄 Detailed conversion plan saved to: ${outputPath}\n`);
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for desktop-first media queries...\n`);

const ignoreRules = loadIgnoreRules();
const results = scanDirectory(srcDir, ignoreRules);
generateReport(results);

process.exit(0);
