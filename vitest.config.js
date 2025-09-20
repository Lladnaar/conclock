import {defineConfig} from "vite";

export default defineConfig({
    test: {
        include: ["server/**/*.test.ts"],
    },
});
