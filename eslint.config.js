// eslint.config.js
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['node_modules/', 'dist/', '*.config.js', '*.config.ts'],
  },

  // ESLint recommended defaults
  eslintJs.configs.recommended,

  // TypeScript specific configurations
  ...tseslint.configs.recommendedTypeChecked, // Recommended rules for TypeScript, requires parserOptions.project
  {
    languageOptions: {
      parserOptions: {
        project: true, // Specify the tsconfig file
        tsconfigRootDir: import.meta.dirname, // Use the directory of eslint.config.js as root
      },
    },
    rules: {
      // Add any specific TypeScript rule overrides here
      // Example: Allow unused vars starting with underscore
       '@typescript-eslint/no-unused-vars': [
        'warn', // or 'error'
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Prettier configuration (must be last to override other formatting rules)
  eslintConfigPrettier
);
