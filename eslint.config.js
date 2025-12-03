import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'dist',
      'dev-dist',
      'node_modules',
      'scripts',
      '*.config.js',
      '*.config.ts',
      '**/*.backup',
      '**/*.test.ts',
      '**/*.test.tsx',
      '.claude/skills/**/assets/**',
      'tests/**',              // Test files (Playwright, etc.)
      'temp-*.ts',             // Temporary files
      'supabase/functions/**'  // Edge functions use Deno console logging
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-undef': 'off', // TypeScript handles this better
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Prevent debug console.log
      // DEBT-008: Complexity rules - prevent new high-complexity code
      // Previous worst offenders have been refactored:
      // - useStatsData.ts (86 → extracted to statsDataHelpers.ts)
      // - SortableEntryCard (64 → extracted to sortableEntryCardUtils.ts)
      // - ShowDetails (51 → extracted to ShowDetailsComponents.tsx)
      // - useEntryNavigation (38 → extracted to useEntryNavigationHelpers.ts)
      // - AKCNationalsScoresheet (37 → extracted to AKCNationalsScoresheetHelpers.ts)
      // - preloadService (36 → extracted to preloadServiceHelpers.ts)
      // - CreateAnnouncementModal (35 → extracted to createAnnouncementHelpers.ts)
      // - useDogDetailsData (34 → extracted to dogDetailsDataHelpers.ts)
      // Threshold: 90 → 50 (2025-12-03) → 40 (2025-12-03)
      // Remaining files over 30: AKCNationalsScoresheet (38), dogDetailsDataHelpers (38),
      //   CreateAnnouncementModal (35), DogDetails (33), EntryListHeader (33),
      //   SubscriptionMonitor (32), notificationService (32)
      // TODO: Continue lowering: 40 -> 30 -> 20 (target)
      'complexity': ['error', { max: 40 }], // Lowered from 50 (Dec 2025)
      'max-depth': ['error', { max: 8 }] // Current max in codebase is 8
    }
  }
];
