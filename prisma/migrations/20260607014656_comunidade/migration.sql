-- CreateTable
CREATE TABLE "VagaGaragem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ALUGUEL',
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "condoId" TEXT NOT NULL,
    "moradorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "VagaGaragem_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VagaGaragem_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnuncioLoja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL,
    "tipo" TEXT NOT NULL DEFAULT 'VENDA',
    "categoria" TEXT NOT NULL DEFAULT 'outro',
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "condoId" TEXT NOT NULL,
    "moradorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "AnuncioLoja_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnuncioLoja_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensagemChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conteudo" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensagemChat_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MensagemChat_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
