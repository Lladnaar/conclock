import {defineConfig} from "vite";

export default defineConfig({
    test: {
        include: ["test/{integration,unit}/*.test.ts"],
    },
});
