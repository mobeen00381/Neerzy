import nextCoreWebVitals from 'eslint-config-next/core-web-vitals.js';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

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
  {
    ...nextCoreWebVitals,
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
  }
);
