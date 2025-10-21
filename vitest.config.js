import {defineConfig} from "vite";

export default defineConfig({
    test: {
        include: ["test/{api,integration,unit}/*.test.ts"],
    },
});
