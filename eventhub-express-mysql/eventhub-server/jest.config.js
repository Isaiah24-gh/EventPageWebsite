/* ==========================================================================
   Jest configuration
   OWNERSHIP: Member 3 (CI/CD) — shared with Member 4 (testing)
   ========================================================================== */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],

  // The MySQL pool holds sockets open. If a test forgets to close it, Jest
  // hangs forever and the CI job burns its 6-hour limit. Fail fast instead.
  testTimeout: 20000,
  forceExit: true,
  detectOpenHandles: true,

  collectCoverageFrom: [
    "routes/**/*.js",
    "middleware/**/*.js",
    "config/**/*.js",
    "server.js",
  ],
  coverageReporters: ["text-summary", "html", "lcov"],

  // Nothing enforced yet — set real numbers once Member 4's suite lands,
  // then CI will fail if coverage regresses.
  // coverageThreshold: { global: { lines: 40, statements: 40 } },
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 15,
      functions: 15,
      lines: 30,
    },
  }
};
