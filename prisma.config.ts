import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/piercyn",
  },
});
