import "dotenv/config";
import { defineConfig } from "@prisma/config"; // Changed from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    directory: "prisma/migrations", // Note: The property name is usually 'directory'
  },
  datasource: {
    url: process.env.DATABASE_URL, // You can use standard process.env here
  },
});