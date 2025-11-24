import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// ES module equivalents for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AKC Scent Work Rulebook Parser
 * Extracts rules from the PDF and structures them for database insertion
 */

interface ParsedRule {
  section: string;
  title: string;
  content: string;
  level: string | null;
  element: string | null;
  category: string;
  keywords: string[];
  measurements: Record<string, any>;
}

// Path to the AKC Scent Work Regulations PDF
const PDF_PATH = String.raw`D:\Access 2013 Applications\mySWT Build\full version 2.7.14\Documents\Scent_Work_Regulations.pdf`;

// Regex patterns for identifying content
const LEVEL_PATTERNS = {
  Novice: /\bnovice\b/i,
  Advanced: /\badvanced\b/i,
  Excellent: /\bexcellent\b/i,
  Master: /\bmaster\b/i,
};

const ELEMENT_PATTERNS = {
  Interior: /\binterior\b/i,
  Exterior: /\bexterior\b/i,
  Container: /\bcontainer\b/i,
  Buried: /\bburied\b/i,
};

// Measurement extraction patterns
// Word-to-number mapping for parsing text
const WORD_TO_NUMBER: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

const MEASUREMENT_PATTERNS = {
  area_sq_ft: /(?:at least\s*)?(\d+)\s*(?:(?:to|and no more than)\s*(\d+))?\s*square\s*feet/i,
  time_minutes: /((?:\d+)|(?:zero|one|two|three|four|five|six|seven|eight|nine|ten))\s*minute[s]?/i,
  warning_seconds: /(\d+)\s*second\s*warning/i,
  hides: /(\d+)\s*(?:to\s*(\d+))?\s*hide[s]?/i,
  height_inches: /(?:at least\s*)?(\d+)\s*(?:to\s*(\d+))?\s*(?:inch|")(?:es)?/i,
  leash_feet: /(\d+)\s*foot\s*leash/i,
  containers: /(\d+)\s*(?:identical\s*)?(?:cardboard\s*)?(?:box\s*)?containers/i,
};

/**
 * Extract level from text
 */
function extractLevel(text: string): string | null {
  for (const [level, pattern] of Object.entries(LEVEL_PATTERNS)) {
    if (pattern.test(text)) {
      return level;
    }
  }
  return null;
}

/**
 * Extract element from text
 */
function extractElement(text: string): string | null {
  for (const [element, pattern] of Object.entries(ELEMENT_PATTERNS)) {
    if (pattern.test(text)) {
      return element;
    }
  }
  return null;
}

/**
 * Extract measurements from text
 */
function extractMeasurements(text: string): Record<string, any> {
  const measurements: Record<string, any> = {};

  // Square feet (area)
  const areaMatch = text.match(MEASUREMENT_PATTERNS.area_sq_ft);
  if (areaMatch) {
    measurements.min_area_sq_ft = parseInt(areaMatch[1]);
    if (areaMatch[2]) {
      measurements.max_area_sq_ft = parseInt(areaMatch[2]);
    }
  }

  // Time in minutes
  const timeMatch = text.match(MEASUREMENT_PATTERNS.time_minutes);
  if (timeMatch) {
    const timeStr = timeMatch[1].toLowerCase();
    // Convert word form to number if needed (e.g., "two" -> 2)
    measurements.time_limit_minutes = WORD_TO_NUMBER[timeStr] !== undefined
      ? WORD_TO_NUMBER[timeStr]
      : parseInt(timeStr);
  }

  // Warning seconds
  const warningMatch = text.match(MEASUREMENT_PATTERNS.warning_seconds);
  if (warningMatch) {
    measurements.warning_seconds = parseInt(warningMatch[1]);
  }

  // Hides
  const hidesMatch = text.match(MEASUREMENT_PATTERNS.hides);
  if (hidesMatch) {
    measurements.min_hides = parseInt(hidesMatch[1]);
    if (hidesMatch[2]) {
      measurements.max_hides = parseInt(hidesMatch[2]);
    }
  }

  // Height
  const heightMatch = text.match(MEASUREMENT_PATTERNS.height_inches);
  if (heightMatch) {
    measurements.min_height_inches = parseInt(heightMatch[1]);
    if (heightMatch[2]) {
      measurements.max_height_inches = parseInt(heightMatch[2]);
    }
  }

  // Leash length
  const leashMatch = text.match(MEASUREMENT_PATTERNS.leash_feet);
  if (leashMatch) {
    measurements.max_leash_length_feet = parseInt(leashMatch[1]);
  }

  // Number of containers
  const containersMatch = text.match(MEASUREMENT_PATTERNS.containers);
  if (containersMatch) {
    measurements.num_containers = parseInt(containersMatch[1]);
  }

  return Object.keys(measurements).length > 0 ? measurements : {};
}

/**
 * Generate keywords from text
 */
function generateKeywords(text: string, level: string | null, element: string | null): string[] {
  const keywords: Set<string> = new Set();

  // Add level and element
  if (level) keywords.add(level.toLowerCase());
  if (element) keywords.add(element.toLowerCase());

  // Common keywords to extract
  const commonTerms = [
    'area', 'size', 'time', 'limit', 'hide', 'hides', 'search', 'handler',
    'dog', 'leash', 'judge', 'warning', 'terrain', 'container', 'interior',
    'exterior', 'buried', 'elimination', 'fault', 'requirement', 'minimum',
    'maximum', 'distraction', 'inaccessible', 'accessible', 'qualification',
    'qualifying', 'score', 'points'
  ];

  const lowerText = text.toLowerCase();
  commonTerms.forEach(term => {
    if (lowerText.includes(term)) {
      keywords.add(term);
    }
  });

  return Array.from(keywords);
}

/**
 * Determine category based on content
 */
function determineCategory(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('area') || lowerText.includes('size')) {
    return 'Search Area';
  } else if (lowerText.includes('time') || lowerText.includes('limit')) {
    return 'Time Limit';
  } else if (lowerText.includes('hide')) {
    return 'Hides';
  } else if (lowerText.includes('leash') || lowerText.includes('equipment')) {
    return 'Equipment';
  } else if (lowerText.includes('handler') || lowerText.includes('conduct')) {
    return 'Handler Requirements';
  } else if (lowerText.includes('judge') || lowerText.includes('score')) {
    return 'Judging';
  } else if (lowerText.includes('fault') || lowerText.includes('elimination')) {
    return 'Faults and Eliminations';
  }

  return 'General';
}

/**
 * Parse the PDF and extract rules
 */
async function parsePDF(): Promise<ParsedRule[]> {
  console.log(`📄 Reading PDF: ${PDF_PATH}`);

  // Read the PDF file
  const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
  const pdfDocument = await loadingTask.promise;

  console.log(`📊 PDF Stats:`);
  console.log(`   - Pages: ${pdfDocument.numPages}`);

  // Extract text from all pages
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  console.log(`   - Text length: ${fullText.length} characters`);
  console.log('\n🔍 Extracting rules...\n');

  const rules: ParsedRule[] = [];

  // Parse Chapter 7 (Odor Search Division) - Find the actual chapter content
  const chapter7StartIdx = fullText.indexOf('CHAPTER 7');
  if (chapter7StartIdx >= 0) {
    // Get text from CHAPTER 7 to CHAPTER 8
    const chapter8Idx = fullText.indexOf('CHAPTER 8', chapter7StartIdx);
    let chapter7Text = chapter8Idx >= 0
      ? fullText.substring(chapter7StartIdx, chapter8Idx)
      : fullText.substring(chapter7StartIdx);

    // Remove page headers that appear as "CHAPTER 7" followed by page numbers
    // These interfere with regex matching
    chapter7Text = chapter7Text.replace(/CHAPTER\s+7\s+\d+/g, '');

    // Extract rules for each element and level combination
    const elements = ['Container', 'Interior', 'Exterior', 'Buried'];
    const levels = ['Novice', 'Advanced', 'Excellent', 'Master'];

    elements.forEach((element, elemIdx) => {
      levels.forEach(level => {
        // Pattern: "Container Novice Class :" or "Interior Advanced Class :"
        const pattern = new RegExp(`${element}\\s+${level}\\s+Class\\s*:(.*?)(?=${element}\\s+(?:Novice|Advanced|Excellent|Master)|Interior|Exterior|Buried|Container|CHAPTER|$)`, 's');
        const match = chapter7Text.match(pattern);

        if (match) {
          const content = match[1].trim();

          const section = `Chapter 7, Section ${elemIdx + 4}`;
          const title = `${element} ${level} Requirements`;

          // Extract measurements
          const measurements = extractMeasurements(content);

          // Extract keywords
          const keywords = generateKeywords(content, level, element);

          // Determine category
          const category = determineCategory(content);

          rules.push({
            section,
            title,
            content,
            level,
            element,
            category,
            keywords,
            measurements,
          });

          console.log(`✓ Extracted: ${title}`);
        }
      });
    });
  } else {
    console.log('⚠️  Could not find CHAPTER 7');
  }

  // Parse Chapter 5 (General Requirements) for common rules
  const chapter5Match = fullText.match(/Chapter 5.*?Requirements Applying to All Classes(.*?)(?=Chapter 6|$)/s);
  if (chapter5Match) {
    const chapter5Text = chapter5Match[1];

    // Extract specific sections that are important general rules
    const generalSections = [
      { num: '1', title: 'Search Area Size', pattern: /Section 1\.\s*Search Area Size(.*?)(?=Section 2|$)/s },
      { num: '13', title: 'Collars, Leashes, and Harnesses', pattern: /Section 13\.\s*Collars, Leashes, and Harnesses(.*?)(?=Section 14|$)/s },
      { num: '16', title: '"Alert" Calls', pattern: /Section 16\.\s*"Alert" Calls(.*?)(?=Section 17|$)/s },
      { num: '20', title: 'Rewards and Reinforcers', pattern: /Section 20\.\s*Rewards and Reinforcers(.*?)(?=Section 21|$)/s },
    ];

    generalSections.forEach(({ num, title, pattern }) => {
      const match = chapter5Text.match(pattern);
      if (match) {
        const content = match[1].trim();
        const section = `Chapter 5, Section ${num}`;
        const measurements = extractMeasurements(content);
        const keywords = generateKeywords(content, null, null);
        const category = determineCategory(content);

        rules.push({
          section,
          title,
          content,
          level: null,
          element: null,
          category,
          keywords,
          measurements,
        });

        console.log(`✓ Extracted: ${title}`);
      }
    });
  }

  console.log(`\n✅ Extracted ${rules.length} rules from PDF`);

  return rules;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 AKC Scent Work Rulebook Parser\n');

    // Check if PDF exists
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ PDF file not found: ${PDF_PATH}`);
      process.exit(1);
    }

    const rules = await parsePDF();

    console.log(`\n✅ Parsing complete!`);
    console.log(`   - Extracted ${rules.length} rules`);

    // Save to JSON file for review
    const outputPath = path.join(__dirname, '../data/parsed-rules.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));

    console.log(`   - Saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error parsing PDF:', error);
    process.exit(1);
  }
}

// Run main function
main();

export { parsePDF, ParsedRule };
