import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

/**
 * Flat ESLint config (ESLint 8.57 + typescript-eslint 7).
 *
 * WHY THE COMPAT BRIDGE: the installed `eslint-config-next@14` is still
 * eslintrc-style — `core-web-vitals.js` exports `{ extends: ['next/core-web-vitals'] }`.
 * Dropping that into a flat config by object-spread pushed the `extends`
 * payload into the config object itself, and ESLint aborted EVERY run with
 * `ConfigError: Unexpected key "0" found`, which is why `npm run lint` was
 * unusable across the whole repo. FlatCompat translates the eslintrc shape into
 * flat config properly.
 *
 * FOLLOW-UP (not done here because it changes dependencies): bumping to
 * `eslint-config-next@16` — the version matching next@16 — ships flat config
 * directly and would let this bridge go away.
 */
const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.vercel/**',
      'public/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // The codebase deliberately uses `any` at the Google/Places response
      // boundaries (every api/* route). Kept as a warning, not an error, so
      // `npm run lint` fails on real problems instead of on ~100 pre-existing
      // `any`s — while still flagging new ones for review.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // No `parserOptions.project`: nothing here enables type-aware rules, and
    // wiring the tsconfig in made a 2-file lint take ~55s instead of seconds.
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  }
);


