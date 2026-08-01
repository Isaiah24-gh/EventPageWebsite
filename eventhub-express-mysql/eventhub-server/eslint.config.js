/* ==========================================================================
   ESLint configuration (flat config, ESLint 9+)
   OWNERSHIP: Member 3 (CI/CD)

   Deliberately lenient. The goal on an existing codebase is a pipeline that
   goes green on day one and catches real bugs — not 400 style warnings that
   train the team to ignore CI. Tighten the `warn` rules once the team is
   used to it.

   Globals are declared by hand rather than pulling in the `globals` package,
   to keep the dependency footprint small.
   ========================================================================== */

const timers = {
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
};

const nodeGlobals = {
  ...timers,
  require: "readonly",
  module: "writable",
  exports: "writable",
  process: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
};

const browserGlobals = {
  ...timers,
  window: "readonly",
  document: "readonly",
  console: "readonly",
  fetch: "readonly",
  alert: "readonly",
  confirm: "readonly",
  location: "readonly",
  navigator: "readonly",
  Notification: "readonly",
  FormData: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  Event: "readonly",
  CustomEvent: "readonly",
  IntersectionObserver: "readonly",
};

const jestGlobals = {
  describe: "readonly",
  it: "readonly",
  test: "readonly",
  expect: "readonly",
  beforeAll: "readonly",
  afterAll: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
  jest: "readonly",
};

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "public/uploads/**",
      "**/*.min.js",
    ],
  },

  // ---- Server-side code ----
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
    rules: {
      // Real bugs — these fail the build.
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-cond-assign": "error",
      "use-isnan": "error",

      // Smells — visible, but don't block a merge.
      // args:"none" because Express error handlers must declare `next`
      // even when they never call it.
      "no-unused-vars": ["warn", { args: "none" }],
      eqeqeq: ["warn", "smart"],
      "no-var": "warn",
    },
  },

  // ---- Browser code ----
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: browserGlobals,
    },
  },

  // ---- Tests ----
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: { ...nodeGlobals, ...jestGlobals },
    },
  },
];
