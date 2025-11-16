#!/usr/bin/env node

/**
 * Media Query Consolidation Tool
 *
 * Consolidates duplicate media query blocks in CSS files.
 * Preserves declaration order to maintain CSS cascade behavior.
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

// Parse CSS file and extract media query blocks
function parseMediaQueries(content) {
  const blocks = [];
  const lines = content.split('\n');
  let currentBlock = null;
  let braceDepth = 0;
  let inMediaQuery = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Detect media query start
    const mediaMatch = trimmed.match(/@media\s*\(([^)]+)\)/);
    if (mediaMatch && !inMediaQuery) {
      currentBlock = {
        query: mediaMatch[0],
        queryCondition: mediaMatch[1].trim(),
        startLine: index + 1,
        endLine: -1,
        content: [],
        rawLines: [line],
      };
      inMediaQuery = true;
      braceDepth = 0;
    } else if (inMediaQuery) {
      currentBlock.rawLines.push(line);

      // Track brace depth
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Extract CSS rules (ignore opening/closing braces of media query itself)
      if (trimmed && trimmed !== '{' && trimmed !== '}') {
        currentBlock.content.push(line);
      }

      // Media query block ends when braces balance
      if (braceDepth === 0 && openBraces > 0) {
        currentBlock.endLine = index + 1;
        blocks.push(currentBlock);
        currentBlock = null;
        inMediaQuery = false;
      }
    }
  });

  return blocks;
}

// Group media queries by condition
function groupMediaQueries(blocks) {
  const groups = new Map();

  blocks.forEach(block => {
    const key = block.queryCondition;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(block);
  });

  return groups;
}

// Consolidate duplicate media queries
function consolidateFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const blocks = parseMediaQueries(content);
  const groups = groupMediaQueries(blocks);

  const duplicates = [];
  const consolidations = [];

  // Find duplicates
  groups.forEach((blockList, condition) => {
    if (blockList.length > 1) {
      duplicates.push({
        condition,
        count: blockList.length,
        blocks: blockList,
      });
    }
  });

  if (duplicates.length === 0) {
    return { hasDuplicates: false, consolidations: [] };
  }

  // Build consolidated version
  let newLines = [...lines];
  const linesToRemove = new Set();

  duplicates.forEach(({ condition, blocks }) => {
    // Keep first occurrence, consolidate others into it
    const firstBlock = blocks[0];
    const consolidatedContent = [];

    // Collect all CSS rules from all blocks
    blocks.forEach(block => {
      consolidatedContent.push(...block.content);
    });

    // Mark all blocks for removal
    blocks.forEach(block => {
      for (let i = block.startLine - 1; i < block.endLine; i++) {
        linesToRemove.add(i);
      }
    });

    // Build new consolidated block
    const newBlock = [
      `@media (${condition}) {`,
      ...consolidatedContent,
      '}',
    ];

    consolidations.push({
      condition,
      originalBlocks: blocks.length,
      firstBlockLine: firstBlock.startLine,
      consolidatedLines: newBlock.length,
    });

    // Insert consolidated block at first occurrence
    newLines.splice(firstBlock.startLine - 1, 0, ...newBlock);
  });

  // Remove marked lines (in reverse to preserve indices)
  newLines = newLines.filter((_, index) => !linesToRemove.has(index));

  const newContent = newLines.join('\n');

  // Write back to file (if not dry run)
  if (!dryRun && duplicates.length > 0) {
    // Create backup
    fs.writeFileSync(filePath + '.backup', content);
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return {
    hasDuplicates: true,
    duplicateCount: duplicates.length,
    consolidations,
    originalLineCount: lines.length,
    newLineCount: newLines.length,
  };
}

// Recursively consolidate directory
function consolidateDirectory(dir, ignoreRules, dryRun = false) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        results.push(...consolidateDirectory(filePath, ignoreRules, dryRun));
      }
    } else if (file.endsWith('.css')) {
      if (shouldIgnoreFile(filePath, ignoreRules)) {
        return;
      }

      const result = consolidateFile(filePath, dryRun);
      if (result.hasDuplicates) {
        results.push({
          file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
          ...result,
        });
      }
    }
  });

  return results;
}

// Generate report
function generateReport(results, dryRun) {
  console.log('\n📱 Media Query Consolidation Report\n');
  console.log('='.repeat(80));
  console.log(`\nMode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (files modified)'}\n`);

  if (results.length === 0) {
    console.log('\n✅ No duplicate media queries found! All files are clean.\n');
    return;
  }

  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicateCount, 0);
  const totalConsolidations = results.reduce((sum, r) => sum + r.consolidations.length, 0);

  console.log(`\n📊 Summary:\n`);
  console.log(`  Files with duplicates: ${results.length}`);
  console.log(`  Total duplicate blocks: ${totalDuplicates}`);
  console.log(`  Consolidations performed: ${totalConsolidations}`);

  console.log(`\n📁 Files (showing first 20):\n`);

  results.slice(0, 20).forEach(({ file, duplicateCount, consolidations, originalLineCount, newLineCount }) => {
    console.log(`\n  ${file}`);
    console.log(`    Duplicate blocks: ${duplicateCount}`);
    console.log(`    Lines: ${originalLineCount} → ${newLineCount} (${originalLineCount - newLineCount} removed)`);

    consolidations.slice(0, 3).forEach(c => {
      console.log(`      • ${c.condition}: ${c.originalBlocks} blocks → 1 block`);
    });

    if (consolidations.length > 3) {
      console.log(`      ... and ${consolidations.length - 3} more consolidations`);
    }
  });

  if (results.length > 20) {
    console.log(`\n  ... and ${results.length - 20} more files`);
  }

  console.log('\n' + '='.repeat(80));

  if (dryRun) {
    console.log('\n💡 This was a dry run. To apply changes, run:');
    console.log('   node consolidate-media-queries.js --apply\n');
  } else {
    console.log('\n✅ Consolidation complete!');
    console.log('\n🔍 Next steps:');
    console.log('   1. Review changes with git diff');
    console.log('   2. Test at all breakpoints (375px, 640px, 1024px, 1440px)');
    console.log('   3. Verify no visual regressions');
    console.log('   4. Run audit: npm run audit:design');
    console.log('   5. Delete .backup files if everything looks good\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for duplicate media queries...\n`);

const ignoreRules = loadIgnoreRules();
const results = consolidateDirectory(srcDir, ignoreRules, dryRun);
generateReport(results, dryRun);

process.exit(0);
