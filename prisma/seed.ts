import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@scamshield.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create a sample client for testing
  const existingClient = await prisma.client.findFirst({ where: { name: "Demo Client" } });
  if (!existingClient) {
    const accessToken = crypto.randomBytes(24).toString("base64url");
    const client = await prisma.client.create({
      data: {
        name: "Demo Client",
        accessToken,
        passcodeHash: await bcrypt.hash("demo1234", 12),
        monthlyQuota: 100,
      },
    });
    console.log(`Demo client created: ${client.name}`);
    console.log(`  Private link: /c/${accessToken}`);
    console.log(`  Passcode: demo1234`);
  } else {
    console.log("Demo client already exists");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
