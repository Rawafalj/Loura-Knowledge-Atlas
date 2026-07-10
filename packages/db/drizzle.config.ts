import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "../../supabase/migrations",
  casing: "snake_case",
  strict: true,
  verbose: true,
});
