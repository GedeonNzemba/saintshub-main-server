module.exports = {
  ignorePatterns: ['node_modules/', 'dist/', '.eslintrc.js', '.prettierrc.js', 'jest.config.js'], // Ignore build output, deps, and config files
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended', // Use basic TS compatibility rules
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier, displays prettier errors as ESLint errors. Must be last.
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    jest: true, // Add Jest environment
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Allow console logs in dev
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off', // Use TS version instead
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn about unused vars, allowing underscores
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on 'any' type
    'prettier/prettier': 'warn', // Show prettier issues as warnings
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow inferred return types for now
    '@typescript-eslint/no-namespace': 'off', // Allow namespaces if needed, though modules are preferred
    // Add any project-specific overrides here
  },
};
