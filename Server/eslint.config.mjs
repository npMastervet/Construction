import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ["src/**/*.ts"] })),
  {
    files: ["src/**/*.ts"],
    rules: {
      // Delayed loading bridges the inherited CommonJS core after env validation.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
