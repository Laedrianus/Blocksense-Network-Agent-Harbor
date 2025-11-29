import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        ignores: ["dist/**", "node_modules/**", "agent-harbor-temp/**", "server/agent-harbor-temp/**"]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooks,
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "no-undef": "off",
            "@typescript-eslint/no-require-imports": "off",
            "no-empty": "off" // Allow empty catch blocks
        }
    }
];
