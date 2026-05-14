import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";

async function main() {
  const users = [
    {
      name: "Admin SamaStock",
      email: "admin@gmail.com",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Employé SamaStock",
      email: "employee@samastock.com",
      password: "employee123",
      role: "employee",
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`${userData.role} existe déjà : ${userData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });

    console.log(`${userData.role} créé : ${userData.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Erreur création utilisateurs :", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });