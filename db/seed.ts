import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import sampleData from "./sample-data";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.product.deleteMany();
   await prisma.account.deleteMany();
    await prisma.session.deleteMany();
     await prisma.verificationToken.deleteMany();
      await prisma.user.deleteMany();
  

  await prisma.product.createMany({
    data: sampleData.products,
  });
    await prisma.user.createMany({
    data: sampleData.users,
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });