#!/usr/bin/env node

/**
 * Color Analysis Tool
 *
 * Analyzes all hardcoded colors in CSS files and maps them to design tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color pattern matching
const COLOR_PATTERNS = {
  hex: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
  rgb: /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g,
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

// Convert hex to RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

// Normalize color to hex
function normalizeColor(color) {
  if (color.startsWith('#')) {
    let hex = color.toLowerCase();
    if (hex.length === 4) {
      // Expand 3-digit hex
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    const hex = '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    return a ? `${hex} (${a} opacity)` : hex;
  }

  return color;
}

// Scan single file
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const colors = new Map(); // color -> { count, contexts: [{ line, property, value }] }

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip lines with var(--
    if (line.includes('var(--')) return;

    // Find all hex colors
    let match;
    const hexPattern = new RegExp(COLOR_PATTERNS.hex);
    while ((match = hexPattern.exec(line)) !== null) {
      const color = match[0];
      const normalized = normalizeColor(color);

      // Extract CSS property
      const propertyMatch = line.match(/([\w-]+):\s*[^;]*#[0-9a-fA-F]+/);
      const property = propertyMatch ? propertyMatch[1] : 'unknown';

      if (!colors.has(normalized)) {
        colors.set(normalized, { count: 0, contexts: [] });
      }

      const colorData = colors.get(normalized);
      colorData.count++;
      colorData.contexts.push({ line: lineNum, property, value: line.trim() });
    }

    // Find all rgb/rgba colors
    const rgbPattern = new RegExp(COLOR_PATTERNS.rgb);
    while ((match = rgbPattern.exec(line)) !== null) {
      const color = match[0];
      const normalized = normalizeColor(color);

      // Extract CSS property
      const propertyMatch = line.match(/([\w-]+):\s*[^;]*rgba?\(/);
      const property = propertyMatch ? propertyMatch[1] : 'unknown';

      if (!colors.has(normalized)) {
        colors.set(normalized, { count: 0, contexts: [] });
      }

      const colorData = colors.get(normalized);
      colorData.count++;
      colorData.contexts.push({ line: lineNum, property, value: line.trim() });
    }
  });

  return colors;
}

// Recursively scan directory
function scanDirectory(dir, ignoreRules, results = new Map()) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(filePath, ignoreRules, results);
      }
    } else if (file.endsWith('.css')) {
      if (shouldIgnoreFile(filePath, ignoreRules)) {
        return;
      }

      const colors = scanFile(filePath);
      const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');

      colors.forEach((data, color) => {
        if (!results.has(color)) {
          results.set(color, { total: 0, files: new Map() });
        }

        const colorData = results.get(color);
        colorData.total += data.count;

        if (!colorData.files.has(relativePath)) {
          colorData.files.set(relativePath, []);
        }

        colorData.files.get(relativePath).push(...data.contexts);
      });
    }
  });

  return results;
}

// Group colors by similarity
function groupSimilarColors(colors) {
  const groups = [];
  const processed = new Set();

  const colorArray = Array.from(colors.entries());

  colorArray.forEach(([color, data]) => {
    if (processed.has(color)) return;

    const group = {
      primary: color,
      variants: [],
      total: data.total,
      files: data.files,
    };

    // Find similar colors (within 10% RGB distance)
    colorArray.forEach(([otherColor, otherData]) => {
      if (color === otherColor || processed.has(otherColor)) return;

      // Only compare hex colors (skip opacity variants)
      if (!color.startsWith('#') || !otherColor.startsWith('#')) return;

      const rgb1 = hexToRgb(color);
      const rgb2 = hexToRgb(otherColor);

      const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
      );

      const maxDistance = 255 * Math.sqrt(3) * 0.1; // 10% threshold

      if (distance < maxDistance) {
        group.variants.push({ color: otherColor, count: otherData.total });
        group.total += otherData.total;
        processed.add(otherColor);
      }
    });

    processed.add(color);
    groups.push(group);
  });

  return groups.sort((a, b) => b.total - a.total);
}

// Generate report
function generateReport(colors) {
  console.log('\n🎨 Color Analysis Report\n');
  console.log('='.repeat(80));

  const totalColors = colors.size;
  const totalOccurrences = Array.from(colors.values()).reduce((sum, data) => sum + data.total, 0);

  console.log(`\n📊 Summary:\n`);
  console.log(`  Unique colors found: ${totalColors}`);
  console.log(`  Total occurrences: ${totalOccurrences}`);

  // Group by frequency
  const groups = groupSimilarColors(colors);

  console.log(`\n🔍 Color Groups (by frequency):\n`);

  groups.slice(0, 20).forEach((group, index) => {
    console.log(`\n${index + 1}. ${group.primary} (${group.total} occurrences)`);

    if (group.variants.length > 0) {
      console.log(`   Variants: ${group.variants.map(v => `${v.color} (${v.count})`).join(', ')}`);
    }

    // Show first 3 files
    const fileEntries = Array.from(group.files.entries()).slice(0, 3);
    fileEntries.forEach(([file, contexts]) => {
      console.log(`   📁 ${file}`);
      contexts.slice(0, 2).forEach(ctx => {
        console.log(`      Line ${ctx.line}: ${ctx.property}`);
      });
      if (contexts.length > 2) {
        console.log(`      ... and ${contexts.length - 2} more`);
      }
    });

    if (group.files.size > 3) {
      console.log(`   ... and ${group.files.size - 3} more files`);
    }
  });

  if (groups.length > 20) {
    console.log(`\n... and ${groups.length - 20} more color groups`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Next Steps:\n');
  console.log('  1. Review top 20 colors and identify which design tokens they should map to');
  console.log('  2. Add any missing tokens to design-tokens.css');
  console.log('  3. Run migrate-colors.js to perform automated migration');
  console.log('');

  // Save detailed results to JSON
  const outputPath = path.join(__dirname, 'color-analysis.json');
  const jsonData = {
    summary: {
      totalColors,
      totalOccurrences,
      timestamp: new Date().toISOString(),
    },
    groups: groups.map(g => ({
      primary: g.primary,
      variants: g.variants,
      total: g.total,
      files: Array.from(g.files.entries()).map(([file, contexts]) => ({
        file,
        occurrences: contexts.length,
        contexts: contexts.slice(0, 5), // Limit to first 5 for JSON size
      })),
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`📄 Detailed analysis saved to: ${outputPath}\n`);
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
console.log(`\n🔍 Scanning ${srcDir} for hardcoded colors...\n`);

const ignoreRules = loadIgnoreRules();
const colors = scanDirectory(srcDir, ignoreRules);
generateReport(colors);
