import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../src/models/User.mjs";

const saltRounds = 10;

const testUsers = [
  {
    email: "patient@test.conectabem.com",
    status: "completed",
    userType: ["patient"],
    name: "QA Paciente Teste",
    birthdayDate: new Date("1990-01-15"),
    address: [
      {
        cep: "01310-100",
        address: "Avenida Paulista",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        active: true,
      },
    ],
  },
  {
    email: "professional@test.conectabem.com",
    status: "completed",
    userType: ["professional"],
    name: "QA Profissional Teste",
    birthdayDate: new Date("1985-06-20"),
    CNPJCPFProfissional: "000.000.000-00",
    professionalSpecialties: ["Acupuntura"],
    clinic: {
      name: "Clínica QA Teste",
      cep: "01310-100",
      address: "Avenida Paulista",
      neighborhood: "Bela Vista",
      number: "1000",
      city: "São Paulo",
      state: "SP",
    },
  },
];

export async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB.");

    const hashedOTP = await bcrypt.hash("000000", saltRounds);

    for (const user of testUsers) {
      const result = await User.updateOne(
        { email: user.email },
        { $set: { ...user, hashedOTP } },
        { upsert: true },
      );

      const action = result.upsertedCount > 0 ? "criado" : "atualizado";
      console.log(`Usuário ${user.email} ${action}.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
