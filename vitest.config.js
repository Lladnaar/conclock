import {defineConfig} from "vite";

export default defineConfig({
    test: {include: [
        "server/**/*.test.ts",
        "end2end/**/*.test.ts",
    ]},
});
