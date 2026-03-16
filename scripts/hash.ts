import { hash } from "bcrypt-ts-edge";

async function run() {
  const password = "admin123";
  const hashed = await hash(password, 10);

  console.log("HASH:", hashed);
}

run();