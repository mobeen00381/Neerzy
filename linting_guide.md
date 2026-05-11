# 🟢 Linting & Code Quality Guide

This guide explains how we fixed the linting issues and how you can maintain high code quality in this project.

## 🛠 How to Run the Linter

You can run the linter at any time by executing:

```bash
npm run lint
```

This will scan the `src` directory for potential errors, accessibility issues, and styling inconsistencies.

## 🚀 What We Fixed

1.  **Command Error**: Fixed the "no such directory: lint" error by updating the `package.json` script to work reliably on Windows.
2.  **ESLint 9 Migration**: Migrated the project to the modern **Flat Config** system (`eslint.config.mjs`) required by Next.js 16.
3.  **Type Safety**: Removed unsafe `any` types in the Agency page and replaced them with a robust `AgencyPlan` interface.
4.  **Accessibility & Entities**: Escaped all unescaped apostrophes and quotes (e.g., `&apos;`, `&quot;`) which can cause issues with some screen readers and browsers.
5.  **Performance Fonts**: Switched from external `<link>` tags to **`next/font/google`** for better performance and to satisfy Next.js best practices.

## 📝 Common Fixes

If you see linting errors in the future, here are the most common solutions:

*   **Unescaped entities**: Instead of `'` or `"`, use `&apos;` or `&quot;` inside JSX text.
*   **Missing Types**: Avoid using `any`. Define an `interface` for your data structures.
*   **Next.js Rules**: Follow the suggestions in the terminal (like using `next/image` or `next/link`) to keep the app optimized.

## ✅ Verification
The project currently passes all lint checks and the production build is fully operational.
