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
      // Current worst: useStatsData.ts (86), SortableEntryCard (64), useEntryListData (59)
      // These are tracked in DEBT_REGISTER.md for future refactoring
      // TODO: Lower thresholds gradually: 90 -> 50 -> 30 -> 15 (target)
      'complexity': ['error', { max: 90 }], // Allow current max, prevent worse
      'max-depth': ['error', { max: 8 }] // Current max in codebase is 8
    }
  }
];
