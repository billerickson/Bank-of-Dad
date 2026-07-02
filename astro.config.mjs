import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  vite: {
    define: {
      __APP_BUILD_ID__: JSON.stringify(Date.now().toString())
    }
  },
  security: {
    checkOrigin: false,
    allowedDomains: [
      {
        hostname: "127.0.0.1",
        protocol: "http",
        port: "4321"
      },
      {
        hostname: "localhost",
        protocol: "http",
        port: "4321"
      }
    ]
  },
  adapter: cloudflare({
    imageService: "passthrough"
  })
});
