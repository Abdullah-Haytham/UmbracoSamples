import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/welcome-dashboard.element.ts",
            formats: ["es"],
        },
        outDir: "../wwwroot/App_Plugins/welcome-dashboard", // all compiled files will be placed here
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/], // ignore the Umbraco Backoffice package in the build
        },
    },
    base: "/App_Plugins/welcome-dashboard/", // the base path of the app in the browser (used for assets)
});