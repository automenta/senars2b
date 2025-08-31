// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: ["dist/", "node_modules/", "jules-scratch/", "vite.config.ts.timestamp-1725091724458-15a1a113c23e8.mjs"],
  },

  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // React configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    }
  },

  // Jest configuration
  {
    files: ["**/*.test.{ts,tsx}"],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
        ...jestPlugin.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // General configuration for all files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    },
  },

  // Prettier config must be last
  prettierConfig,
);
