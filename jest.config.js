/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          rootDir: ".",
          types: ["node", "jest"],
          target: "ES2020",
          module: "commonjs",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      },
    ],
  },

  setupFiles: ["<rootDir>/src/jest.setup.ts"],

  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/tests/**/*.test.ts",
  ],

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
