import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/remotes/checkout/",
  plugins: [
    react(),
    federation({
      name: "checkout",
      filename: "remoteEntry.js",
      manifest: true,
      exposes: {
        "./CartPanel": "./src/components/CartPanel.tsx",
        "./formatPrice": "./src/utils/formatPrice.ts"
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
