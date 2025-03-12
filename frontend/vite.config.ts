import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@use "/src/sass" as *;`,
  //       silenceDeprecations: ["legacy-js-api"],
  //     },
  //   },
  // },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
    // host: true,
    // port: 3000,
  },
  plugins: [react()],
});
