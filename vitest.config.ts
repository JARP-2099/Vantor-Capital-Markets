import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The Next.js "server-only" guard throws outside a React Server
      // environment; tests exercise server modules directly, so stub it.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // DB integration tests share one test database; keep them serial.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
