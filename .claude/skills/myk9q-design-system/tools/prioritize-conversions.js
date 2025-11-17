#!/usr/bin/env node

/**
 * Prioritized Desktop-First Conversion List
 *
 * Analyzes the conversion plan and sorts files by difficulty (number of blocks).
 * Generates a prioritized list for manual conversion.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const planPath = path.join(__dirname, 'desktop-first-conversion-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));

// Sort files by number of desktop-first blocks (simplest first)
const sorted = plan.files.sort((a, b) => a.desktopFirstCount - b.desktopFirstCount);

console.log('\n📋 PRIORITIZED DESKTOP-FIRST CONVERSION LIST\n');
console.log('='.repeat(80));
console.log('');

// Group by difficulty
const easy = sorted.filter(f => f.desktopFirstCount === 1);
const medium = sorted.filter(f => f.desktopFirstCount >= 2 && f.desktopFirstCount <= 3);
const hard = sorted.filter(f => f.desktopFirstCount >= 4);

console.log(`🟢 EASY (1 block) - Start here! (${easy.length} files)\n`);
easy.forEach((f, i) => {
  const conv = f.conversions[0];
  console.log(`  ${i + 1}. ${f.file}`);
  console.log(`     Line: ${conv.lineRange}, Rules: ${conv.ruleCount}, Breakpoint: ${conv.originalBreakpoint}`);
});

console.log('');
console.log(`🟡 MEDIUM (2-3 blocks) - Do after easy files (${medium.length} files)\n`);
medium.forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.file} (${f.desktopFirstCount} blocks)`);
  f.conversions.forEach(conv => {
    console.log(`     • Line ${conv.lineRange}: ${conv.ruleCount} rules (${conv.originalBreakpoint})`);
  });
});

console.log('');
console.log(`🔴 HARD (4+ blocks) - Save for last (${hard.length} files)\n`);
hard.forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.file} (${f.desktopFirstCount} blocks)`);
});

console.log('');
console.log('='.repeat(80));
console.log('');
console.log('📊 SUMMARY:');
console.log(`  Easy files (1 block): ${easy.length}`);
console.log(`  Medium files (2-3 blocks): ${medium.length}`);
console.log(`  Hard files (4+ blocks): ${hard.length}`);
console.log(`  Total files remaining: ${sorted.length}`);
console.log('');
console.log('💡 RECOMMENDATION:');
console.log('  1. Start with EASY files (5-10 minutes each)');
console.log('  2. Build confidence with pattern');
console.log('  3. Move to MEDIUM files when comfortable');
console.log('  4. Tackle HARD files last (may need consolidation first)');
console.log('');

// Generate next 5 targets
console.log('🎯 NEXT 5 TARGETS (easiest first):');
easy.slice(0, 5).forEach((f, i) => {
  const conv = f.conversions[0];
  console.log(`  ${i + 1}. ${f.file.replace('/src/', '')}`);
});
console.log('');

process.exit(0);
