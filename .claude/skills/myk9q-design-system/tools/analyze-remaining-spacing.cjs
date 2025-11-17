/**
 * Analyze remaining spacing violations after Phase 6E ignores
 * This helps identify what should be migrated vs documented
 */

const fs = require('fs');
const path = require('path');

// Known intentional values (already in .auditignore)
const INTENTIONAL_VALUES = [
  '1px', '0.5px',           // Optical alignment
  '44px', '48px',           // Touch targets
  '1rem', '1.5rem', '2rem', '2.5rem', '3rem',  // Icon sizes
  '640px', '1024px', '1440px',  // Breakpoints
  '0.875rem', '14px',       // Button/form padding
  '0.8125rem', '13px',      // Small button padding
];

// Design tokens (values that should be used instead of hardcoded)
const DESIGN_TOKENS = {
  '0.125rem': 'var(--token-space-xs)',   // 2px
  '0.25rem': 'var(--token-space-sm)',    // 4px
  '0.5rem': 'var(--token-space-md)',     // 8px
  '0.75rem': 'var(--token-space-lg)',    // 12px
  '1rem': 'var(--token-space-xl)',       // 16px
  '1.25rem': 'var(--token-space-2xl)',   // 20px
  '1.5rem': 'var(--token-space-3xl)',    // 24px
  '2rem': 'var(--token-space-4xl)',      // 32px
  '2px': 'var(--token-space-xs)',
  '4px': 'var(--token-space-sm)',
  '8px': 'var(--token-space-md)',
  '12px': 'var(--token-space-lg)',
  '16px': 'var(--token-space-xl)',
  '20px': 'var(--token-space-2xl)',
  '24px': 'var(--token-space-3xl)',
  '32px': 'var(--token-space-4xl)',
};

// Find all CSS files
function findCssFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(file)) {
      findCssFiles(filePath, results);
    } else if (file.endsWith('.css') && !file.includes('design-tokens.css')) {
      results.push(filePath);
    }
  });
  return results;
}

// Extract spacing values with context
const spacingPattern = /(?:padding|margin|gap|width|height|top|left|right|bottom):\s*(\d+(?:\.\d+)?(?:px|rem|em))/g;
const spacingCounts = {};
const spacingContexts = {};

const srcDir = path.join(process.cwd(), 'src');
const cssFiles = findCssFiles(srcDir);

console.log(`\n📊 Analyzing ${cssFiles.length} CSS files for remaining spacing violations...\n`);

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = spacingPattern.exec(content)) !== null) {
    const value = match[1];
    const fullMatch = match[0];

    // Skip values in var() or url()
    const context = content.substring(Math.max(0, match.index - 10), match.index);
    if (context.includes('var(') || context.includes('url(')) continue;

    // Skip intentional values
    if (INTENTIONAL_VALUES.includes(value)) continue;

    // Skip if already using a token value
    if (DESIGN_TOKENS[value]) continue;

    // Count and store context
    spacingCounts[value] = (spacingCounts[value] || 0) + 1;
    if (!spacingContexts[value]) spacingContexts[value] = [];
    spacingContexts[value].push({
      file: path.relative(process.cwd(), file),
      property: fullMatch.split(':')[0]
    });
  }
});

// Sort by frequency
const sorted = Object.entries(spacingCounts)
  .sort((a, b) => b[1] - a[1]);

console.log('═'.repeat(80));
console.log('REMAINING SPACING VIOLATIONS (after Phase 6E ignores)');
console.log('═'.repeat(80));
console.log('\nTotal unique values:', sorted.length);
console.log('Total violations:', sorted.reduce((sum, [_, count]) => sum + count, 0));
console.log('\n');

// Categorize violations
const categories = {
  migratable: [],      // Can be migrated to existing tokens
  componentSizes: [],  // Component-specific sizes (should document)
  layoutSizes: [],     // Layout-specific sizes (might need tokens)
  oddValues: [],       // Non-standard values (need review)
};

sorted.forEach(([value, count]) => {
  const numValue = parseFloat(value);
  const unit = value.replace(/[\d.]/g, '');

  // Convert to px for comparison
  let pxValue = numValue;
  if (unit === 'rem' || unit === 'em') {
    pxValue = numValue * 16;
  }

  // Categorize
  if (DESIGN_TOKENS[value]) {
    categories.migratable.push([value, count]);
  } else if (pxValue >= 40 && pxValue <= 100) {
    // Likely component sizes
    categories.componentSizes.push([value, count]);
  } else if (pxValue > 100) {
    // Likely layout sizes
    categories.layoutSizes.push([value, count]);
  } else {
    // Odd values
    categories.oddValues.push([value, count]);
  }
});

// Print categorized results
console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ 1. MIGRATABLE TO EXISTING TOKENS (should migrate)                          │');
console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
categories.migratable.forEach(([value, count]) => {
  console.log(`  ${value.padEnd(12)} → ${DESIGN_TOKENS[value].padEnd(30)} (${count}x)`);
});

console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ 2. COMPONENT SIZES 40-100px (likely intentional - should document)         │');
console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
categories.componentSizes.slice(0, 20).forEach(([value, count]) => {
  const contexts = spacingContexts[value].slice(0, 3);
  console.log(`  ${value.padEnd(12)} (${count}x)`);
  contexts.forEach(ctx => {
    console.log(`    → ${ctx.property} in ${ctx.file}`);
  });
});

console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ 3. LAYOUT SIZES >100px (likely intentional - should document)              │');
console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
categories.layoutSizes.slice(0, 15).forEach(([value, count]) => {
  const contexts = spacingContexts[value].slice(0, 2);
  console.log(`  ${value.padEnd(12)} (${count}x)`);
  contexts.forEach(ctx => {
    console.log(`    → ${ctx.property} in ${ctx.file}`);
  });
});

console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ 4. ODD VALUES <40px (need review)                                          │');
console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
categories.oddValues.slice(0, 30).forEach(([value, count]) => {
  const contexts = spacingContexts[value].slice(0, 2);
  console.log(`  ${value.padEnd(12)} (${count}x)`);
  contexts.forEach(ctx => {
    console.log(`    → ${ctx.property} in ${ctx.file}`);
  });
});

// Summary
console.log('\n');
console.log('═'.repeat(80));
console.log('SUMMARY & RECOMMENDATIONS');
console.log('═'.repeat(80));
console.log(`\n📈 Migratable to existing tokens: ${categories.migratable.reduce((sum, [_, c]) => sum + c, 0)} violations`);
console.log(`📦 Component sizes (document): ${categories.componentSizes.reduce((sum, [_, c]) => sum + c, 0)} violations`);
console.log(`📐 Layout sizes (document): ${categories.layoutSizes.reduce((sum, [_, c]) => sum + c, 0)} violations`);
console.log(`⚠️  Odd values (review): ${categories.oddValues.reduce((sum, [_, c]) => sum + c, 0)} violations`);

console.log('\n💡 RECOMMENDATION:');
console.log('   1. Migrate migratable values to existing tokens (automated)');
console.log('   2. Document component/layout sizes as intentional in .auditignore');
console.log('   3. Manually review odd values case-by-case\n');
