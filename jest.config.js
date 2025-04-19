// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // Optional: Setup file to run before each test (e.g., for environment variables)
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  // Optional: Collect coverage information
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageProvider: "v8",
  // Tell ts-jest to use ESM mode
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // Module name mapper for handling paths like "../models/Space.js"
  // Adjust this based on your actual module resolution and paths
  moduleNameMapper: {
    // If you have path aliases in tsconfig.json, map them here too
    // Example: '^@/(.*)$': '<rootDir>/src/$1'
    // Handle .js extensions in imports from TS files
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  // Optional: Explicitly define test file pattern
  testMatch: [
    "**/__tests__/**/*.test.ts"
  ],
};
