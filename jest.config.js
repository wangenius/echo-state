module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: [
    "jest-localstorage-mock",
    "fake-indexeddb/auto",
  ],
  setupFilesAfterEnv: [
    "@testing-library/jest-dom"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"  // 如果有样式文件的话
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  }
}; 