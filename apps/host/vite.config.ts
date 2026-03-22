import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/host/",
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        checkout: {
          type: "module",
          name: "checkout",
          entry: "http://localhost:8080/remotes/checkout/remoteEntry.js"
        }
      },
      shared: {
        react: {
          singleton: true
        },
        "react-dom": {
          singleton: true
        }
      }
    })
  ]
});
