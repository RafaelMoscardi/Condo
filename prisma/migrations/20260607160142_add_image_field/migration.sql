-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "perfil" TEXT NOT NULL DEFAULT 'MORADOR',
    "apartamento" TEXT,
    "bloco" TEXT,
    "cpf" TEXT,
    "telefone" TEXT,
    "fotoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "condoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("apartamento", "ativo", "bloco", "condoId", "cpf", "createdAt", "email", "emailVerified", "fotoUrl", "id", "name", "password", "perfil", "telefone") SELECT "apartamento", "ativo", "bloco", "condoId", "cpf", "createdAt", "email", "emailVerified", "fotoUrl", "id", "name", "password", "perfil", "telefone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
