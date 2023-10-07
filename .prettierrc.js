/**
 * @type {import("prettier").Config}
 */
module.exports = {
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 80,
  arrowParens: "always",
  useTabs: false,
  tabWidth: 2,
  semi: true,
  bracketSameLine: false,
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "^react$",
    "^server$",
    "<THIRD_PARTY_MODULES>",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderParserPlugins: ["typescript", "jsx", "decorators"],
  endOfLine: "lf",
  tailwindConfig: "./tailwind.config.ts",
};
