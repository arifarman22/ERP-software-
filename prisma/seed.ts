import { PrismaClient, Role } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await hash("T3@Estate#Adm!n2024$", 12);

  await prisma.user.upsert({
    where: { email: "superadmin@teaestate.erp" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@teaestate.erp",
      password,
      role: Role.ADMIN,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
