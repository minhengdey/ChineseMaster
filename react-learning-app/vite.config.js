import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
   plugins: [react(), tailwindcss()],
   server: {
      port: 5501,

      allowedHosts: [
         "localhost",
         "nonperforated-paneless-allison.ngrok-free.dev",
      ],
   },
});
