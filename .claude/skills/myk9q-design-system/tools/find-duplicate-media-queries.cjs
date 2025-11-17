const fs = require('fs');
const path = require('path');

function findDuplicateMediaQueries(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.includes('node_modules')) {
      findDuplicateMediaQueries(filePath, results);
    } else if (file.name.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Count @media blocks for each breakpoint
      const breakpoints = {
        '640px': [],
        '1024px': [],
        '1440px': []
      };

      lines.forEach((line, idx) => {
        if (line.trim().match(/^@media \(min-width: 640px\)/)) {
          breakpoints['640px'].push(idx + 1);
        }
        if (line.trim().match(/^@media \(min-width: 1024px\)/)) {
          breakpoints['1024px'].push(idx + 1);
        }
        if (line.trim().match(/^@media \(min-width: 1440px\)/)) {
          breakpoints['1440px'].push(idx + 1);
        }
      });

      let totalDuplicates = 0;
      for (const bp in breakpoints) {
        if (breakpoints[bp].length > 1) {
          totalDuplicates += breakpoints[bp].length - 1;
        }
      }

      if (totalDuplicates > 0) {
        results.push({
          file: filePath.replace(/\\/g, '/'),
          duplicates: totalDuplicates,
          breakpoints: Object.fromEntries(
            Object.entries(breakpoints).filter(([, lines]) => lines.length > 1)
          )
        });
      }
    }
  }

  return results;
}

const srcDir = path.join(__dirname, '../../../../src');
const results = findDuplicateMediaQueries(srcDir);

// Sort by number of duplicates
results.sort((a, b) => b.duplicates - a.duplicates);

console.log('Files with duplicate media query blocks:\n');
results.forEach(({ file, duplicates, breakpoints }) => {
  const relativePath = file.replace(srcDir.replace(/\\/g, '/'), '');
  console.log(`📁 ${relativePath}`);
  console.log(`   ${duplicates} duplicate block(s)`);
  for (const [bp, lines] of Object.entries(breakpoints)) {
    console.log(`   - ${lines.length} blocks for ${bp} (lines: ${lines.join(', ')})`);
  }
  console.log('');
});

console.log(`\nTotal files: ${results.length}`);
console.log(`Total duplicate blocks: ${results.reduce((sum, r) => sum + r.duplicates, 0)}`);
