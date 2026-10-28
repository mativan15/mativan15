import eslint from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            ".astro/**",
            "public/**",
            "sketches/**",
            "**/*.jpeg",
            "**/*.jpg"
        ]
    },
    {
        files: ["astro.config.mjs"],
        languageOptions: {
            globals: {
                process: "readonly"
            }
        }
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...astro.configs.recommended,
    {
        files: ["src/scripts/intro.ts"],
        rules: {
            "@typescript-eslint/ban-ts-comment": "off"
        }
    }
);
