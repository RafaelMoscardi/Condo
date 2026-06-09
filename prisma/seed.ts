import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("senha123", 10);

  const condo = await prisma.condo.upsert({
    where: { id: "condo-principal" },
    update: {},
    create: {
      id: "condo-principal",
      nome: "Condomínio Residencial das Flores",
      endereco: "Av. das Flores, 100 - São Paulo, SP",
    },
  });

  const sindico = await prisma.user.upsert({
    where: { email: "sindico@condo.com" },
    update: {},
    create: {
      name: "Carlos Síndico",
      email: "sindico@condo.com",
      password: senhaHash,
      perfil: "SINDICO",
      condoId: condo.id,
    },
  });

  const morador = await prisma.user.upsert({
    where: { email: "morador@condo.com" },
    update: {},
    create: {
      name: "Ana Morador",
      email: "morador@condo.com",
      password: senhaHash,
      perfil: "MORADOR",
      apartamento: "101",
      bloco: "A",
      condoId: condo.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "morador2@condo.com" },
    update: {},
    create: {
      name: "Pedro Morador",
      email: "morador2@condo.com",
      password: senhaHash,
      perfil: "MORADOR",
      apartamento: "202",
      bloco: "B",
      condoId: condo.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "porteiro@condo.com" },
    update: {},
    create: {
      name: "João Porteiro",
      email: "porteiro@condo.com",
      password: senhaHash,
      perfil: "PORTEIRO",
      condoId: condo.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@condo.com" },
    update: {},
    create: {
      name: "Maria Administradora",
      email: "admin@condo.com",
      password: senhaHash,
      perfil: "ADMINISTRADORA",
      condoId: condo.id,
    },
  });

  const areas = [
    {
      id: "area-salao",
      nome: "Salão de Festas",
      descricao: "Salão para eventos com capacidade de 80 pessoas",
      capacidade: 80,
    },
    {
      id: "area-churrasqueira",
      nome: "Churrasqueira",
      descricao: "Área de churrasqueira com 4 grelhas",
      capacidade: 20,
    },
    {
      id: "area-quadra",
      nome: "Quadra Poliesportiva",
      descricao: "Quadra para futebol, vôlei e basquete",
      capacidade: 30,
    },
  ];

  for (const area of areas) {
    await prisma.areaComum.upsert({
      where: { id: area.id },
      update: {},
      create: { ...area, condoId: condo.id },
    });
  }

  // Aviso de exemplo
  await prisma.aviso.upsert({
    where: { id: "aviso-boas-vindas" },
    update: {},
    create: {
      id: "aviso-boas-vindas",
      titulo: "Bem-vindos ao sistema do condomínio!",
      descricao:
        "Este é o mural de avisos do condomínio. Aqui o síndico publicará comunicados importantes.",
      categoria: "geral",
      urgente: false,
      condoId: condo.id,
      autorId: sindico.id,
    },
  });

  // Ocorrência de exemplo
  await prisma.ocorrencia.upsert({
    where: { id: "ocorrencia-exemplo" },
    update: {},
    create: {
      id: "ocorrencia-exemplo",
      tipo: "iluminacao",
      descricao: "Lâmpada queimada no corredor do 2º andar — bloco A.",
      status: "ABERTA",
      condoId: condo.id,
      moradorId: morador.id,
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log("\nUsuários criados:");
  console.log("  sindico@condo.com   → senha123  (Síndico)");
  console.log("  morador@condo.com   → senha123  (Morador - Apt 101-A)");
  console.log("  morador2@condo.com  → senha123  (Morador - Apt 202-B)");
  console.log("  porteiro@condo.com  → senha123  (Porteiro)");
  console.log("  admin@condo.com     → senha123  (Administradora)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
