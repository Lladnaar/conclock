import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

const fixOnly = process.argv.includes("--fix") ? "warn" : "off";
const onlyAfter = {before: false, after: true};
const bothSides = {before: true, after: true};
const multiLine = {multiline: true};
const consistent = {consistent: true};

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: {js, stylistic},
        extends: ["js/recommended"],
    },
    {
        files: ["server/**/*.{js,mjs,cjs,ts,mts,cts}", "*config.js"],
        languageOptions: {globals: globals.node},
    },
    {
        files: ["client/**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {globals: globals.browser},
    },
    tseslint.configs.recommended,
    {
        rules: {
            // Symbol presence / absence
            "stylistic/comma-dangle":           ["warn", "always-multiline"], // Require trailing commas
            "stylistic/member-delimiter-style": ["warn"], // Semis for interface and type
            "stylistic/no-extra-semi":          ["warn"], // Disallow unnecessary semicolons
            "stylistic/no-floating-decimal":    ["warn"], // No floating decimal
            "stylistic/quote-props":            ["warn", "as-needed"], // Don't quote object literals
            "stylistic/quotes":                 ["warn", "double"], // Use double quotes
            "stylistic/semi":                   ["warn", "always"], // Require optional semicolons

//          "stylistic/arrow-parens":       ["warn"], // Require parentheses around arrow function arguments
//          "stylistic/new-parens":         ["warn"], // Enforce or disallow parentheses when invoking a constructor with no arguments
//          "stylistic/no-confusing-arrow": ["warn"], // Disallow arrow functions where they could be confused with comparisons
//          "stylistic/no-extra-parens":    ["warn"], // Disallow unnecessary parentheses
//          "stylistic/no-mixed-operators": ["warn"], // Disallow mixed binary operators
//          "stylistic/wrap-regex":         ["warn"], // Require parenthesis around regex literals
//          "stylistic/wrap-iife":          ["warn"], // Require parentheses around immediate `function` invocations

            // Symbol location
            "stylistic/brace-style":        ["warn", "stroustrup", {allowSingleLine: true}], // Brace style
            "stylistic/comma-style":        ["warn", "last"], // Commas on line ends
            "stylistic/dot-location":       ["warn", "property"], // Dots on line starts
            "stylistic/multiline-ternary":  ["warn", "always-multiline"], // Newlines in ternary ops
            "stylistic/operator-linebreak": ["warn", "before"], // Operators on line starts
            "stylistic/semi-style":         ["warn", "last"], // Semis on line ends

            // Block spacing (fix only)
            "stylistic/array-bracket-spacing":     [fixOnly, "never"], // No space inside array
            "stylistic/block-spacing":             [fixOnly, "always"], // Spaces inside blocks
            "stylistic/computed-property-spacing": [fixOnly, "never"], // No space inside brackets
            "stylistic/object-curly-spacing":      [fixOnly, "never"], // No spacing inside braces
            "stylistic/space-in-parens":           [fixOnly, "never"], // No spacing inside parentheses
            "stylistic/template-curly-spacing":    [fixOnly, "never"], // No spacing arround template expressions

            // Bracket spacing (fix only)
            "stylistic/function-call-spacing":       [fixOnly, "never"], // No space before function params
            "stylistic/space-before-blocks":         [fixOnly, "always"], // Space before blocks
            "stylistic/space-before-function-paren": [fixOnly, {anonymous: "always", named: "never", asyncArrow: "always", catch: "always"}], // Spaces except named functions

            // Other spacing (fix only)
            "stylistic/arrow-spacing":                 [fixOnly, bothSides], // Space arround arrow functions
            "stylistic/comma-spacing":                 [fixOnly, onlyAfter], // Space after commas
// ?        "stylistic/generator-star-spacing":        [fixOnly], // Enforce consistent spacing around `*` operators in generator functions
            "stylistic/key-spacing":                   [fixOnly, {mode: "minimum"}], // Space(s) after property colon
            "stylistic/keyword-spacing":               [fixOnly, bothSides], // Space arround keywords
//          "stylistic/no-multi-spaces":               [fixOnly], // Disallow multiple spaces
            "stylistic/no-whitespace-before-property": [fixOnly], // Disallow whitespace before properties
            "stylistic/rest-spread-spacing":           [fixOnly, "never"], // No space after spread
            "stylistic/semi-spacing":                  [fixOnly, onlyAfter], // Spaces only after semicolons
            "stylistic/space-infix-ops":               [fixOnly], // Spacing around operators
            "stylistic/space-unary-ops":               [fixOnly, {words: true, nonwords: false}], // No space for symbol unaries
            "stylistic/switch-colon-spacing":          [fixOnly, onlyAfter], // Spaces only after switch colon
// ?        "stylistic/template-tag-spacing":          [fixOnly], // Require or disallow spacing between template tags and their literals
            "stylistic/type-annotation-spacing":       [fixOnly, onlyAfter], // Spaces only after type colon
            "stylistic/type-generic-spacing":          [fixOnly], // Spacing inside generics
            "stylistic/type-named-tuple-spacing":      [fixOnly], // Spacing for named tuple
// ?        "stylistic/yield-star-spacing":            [fixOnly], // Require or disallow spacing around the `*` in `yield*` expressions

            // Line breaks (fix only)
            "stylistic/array-bracket-newline":    [fixOnly, multiLine], // Bracket newlines if multiline
            "stylistic/curly-newline":            [fixOnly, consistent], // Block newlines if present/multiline
            "stylistic/function-paren-newline":   [fixOnly, "multiline"], // Param newlines if multiline
            "stylistic/implicit-arrow-linebreak": [fixOnly, "beside"], // Brace beside arrow
            "stylistic/object-curly-newline":     [fixOnly, multiLine], // Object newlines if multiline

            "stylistic/array-element-newline":          [fixOnly, multiLine], // Array newlines if multiline
            "stylistic/function-call-argument-newline": [fixOnly, "consistent"], // Consistent param line breaks
            "stylistic/object-property-newline":        [fixOnly, {allowAllPropertiesOnSameLine: true}], // Property newlines if multiline
            "stylistic/padded-blocks":                  [fixOnly, "never"], // No padding inside blocks

            "stylistic/lines-between-class-members":     [fixOnly, {enforce: [{blankLine: "never", prev: "field", next: "field"}]}], // Require or disallow an empty line between class members
//          "stylistic/max-statements-per-line":         [fixOnly], // Enforce a maximum number of statements allowed per line
//          "stylistic/newline-per-chained-call":        [fixOnly], // Require a newline after each call in a method chain
//          "stylistic/one-var-declaration-per-line":    [fixOnly], // Require or disallow newlines around variable declarations
//          "stylistic/padding-line-between-statements": [fixOnly], // Require or disallow padding lines between statements

            // Comments (fix only)
//          "stylistic/lines-around-comment":    [fixOnly], // Require empty lines around comments
//          "stylistic/line-comment-position":   [fixOnly], // Enforce position of line comments
//          "stylistic/multiline-comment-style": [fixOnly], // Enforce a particular style for multiline comments
//          "stylistic/spaced-comment":          [fixOnly], // Enforce consistent spacing after the `//` or `/*` in a comment

            // File format (fix only)
            "stylistic/eol-last":                 [fixOnly, "always"], // Files end with EOL
            "stylistic/indent":                   [fixOnly, 4, {ignoreComments: true}], // Enforce consistent indentation
            "stylistic/indent-binary-ops":        [fixOnly, 4], // Indentation for binary operators
//          "stylistic/linebreak-style":          [fixOnly], // Enforce consistent linebreak style
//          "stylistic/max-len":                  [fixOnly], // Enforce a maximum line length
//          "stylistic/no-mixed-spaces-and-tabs": [fixOnly], // Disallow mixed spaces and tabs for indentation
            "stylistic/no-multiple-empty-lines":  [fixOnly, {max: 1, maxEOF: 0}], // Minimise empty lines
//          "stylistic/no-tabs":                  [fixOnly], // Disallow all tabs
            "stylistic/no-trailing-spaces":       [fixOnly], // Disallow trailing whitespace at the end of lines
        },
    },
]);
