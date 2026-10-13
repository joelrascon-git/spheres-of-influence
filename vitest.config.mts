import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" resolves to a throwing module outside React server contexts;
      // stub it so the headless loader can import the server modules it guards.
      "server-only": path.resolve(import.meta.dirname, "scripts/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "supabase/**/*.test.ts"],
    testTimeout: 30000,
  },
});
