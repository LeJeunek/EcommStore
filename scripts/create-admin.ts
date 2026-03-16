import { prisma } from "../db/prisma";
import bcrypt from "bcrypt";

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "admin",
    },
  });

  console.log("Admin created:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());