import { defineConfig } from "astro/config";

export default defineConfig({
  base: "/astro-preview",
  outDir: "../public/astro-preview",
  build: {
    format: "directory",
  },
});
