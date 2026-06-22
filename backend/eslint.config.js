const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const pluginPrettier = require("eslint-plugin-prettier");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: ["eslint.config.js", "dist/**/*"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);
