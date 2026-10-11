import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
   resolve: {
      alias: {
         "@": path.resolve(__dirname, "src"),
      },
   },
   plugins: [react(), tailwindcss()],
   server: {
      port: 5501,

      allowedHosts: [
         "localhost",
         "nonperforated-paneless-allison.ngrok-free.dev",
      ],
   },
});
