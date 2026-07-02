import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  security: {
    allowedDomains: [
      {
        hostname: "bod.billerickson.net",
        protocol: "https"
      },
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
