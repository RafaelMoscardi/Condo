-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VagaGaragem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ALUGUEL',
    "periodoAluguel" TEXT NOT NULL DEFAULT 'MENSAL',
    "bloco" TEXT,
    "numeroApto" TEXT,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "condoId" TEXT NOT NULL,
    "moradorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "VagaGaragem_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VagaGaragem_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VagaGaragem" ("atualizadaEm", "condoId", "criadaEm", "descricao", "disponivel", "id", "moradorId", "tipo", "titulo", "valor") SELECT "atualizadaEm", "condoId", "criadaEm", "descricao", "disponivel", "id", "moradorId", "tipo", "titulo", "valor" FROM "VagaGaragem";
DROP TABLE "VagaGaragem";
ALTER TABLE "new_VagaGaragem" RENAME TO "VagaGaragem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
