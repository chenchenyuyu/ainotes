import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
