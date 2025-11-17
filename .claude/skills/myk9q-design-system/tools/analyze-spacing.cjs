/**
 * Analyze hardcoded spacing values in CSS files
 */

const fs = require('fs');
const path = require('path');

// Find all CSS files
function findCssFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(file)) {
      findCssFiles(filePath, results);
    } else if (file.endsWith('.css')) {
      results.push(filePath);
    }
  });
  return results;
}

// Extract spacing values
const spacingPattern = /\b(\d+(?:\.\d+)?(?:px|rem|em))\b/g;
const spacingCounts = {};

const srcDir = path.join(process.cwd(), 'src');
const cssFiles = findCssFiles(srcDir);

console.log(`\nAnalyzing ${cssFiles.length} CSS files...\n`);

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = spacingPattern.exec(content)) !== null) {
    const value = match[1];
    // Skip values in var() or url()
    const context = content.substring(Math.max(0, match.index - 10), match.index);
    if (!context.includes('var(') && !context.includes('url(')) {
      spacingCounts[value] = (spacingCounts[value] || 0) + 1;
    }
  }
});

// Sort by frequency
const sorted = Object.entries(spacingCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50);

console.log('Top 50 hardcoded spacing values by frequency:\n');
sorted.forEach(([value, count]) => {
  console.log(`${value.padEnd(12)} ${count}x`);
});

console.log(`\n\nTotal unique values: ${Object.keys(spacingCounts).length}`);
