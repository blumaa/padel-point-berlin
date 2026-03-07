module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "bug",
        "chore",
        "proj",
        "docs",
        "style",
        "refactor",
        "test",
        "ci",
        "build",
        "perf",
        "revert",
      ],
    ],
  },
};
