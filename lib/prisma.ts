// lib/prisma.ts
import "dotenv/config"; // load DATABASE_URL from .env
import { PrismaPg } from "@prisma/adapter-pg"; // Postgres adapter for Prisma 7
import { PrismaClient } from "@prisma/client";
// Make sure your DATABASE_URL is defined in .env
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL not defined in .env");

// Create the adapter
const adapter = new PrismaPg({ connectionString });

// Instantiate PrismaClient with adapter
export const prisma = new PrismaClient({ adapter });