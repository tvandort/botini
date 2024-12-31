import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/*"] },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.browser } },
);

// /** @type {import('eslint').Linter.Config[]} */
// export default [
//   { languageOptions: { globals: globals.browser } },
//   pluginJs.configs.recommended,
// ];
