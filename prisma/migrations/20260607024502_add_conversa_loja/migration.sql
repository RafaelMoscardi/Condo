-- CreateTable
CREATE TABLE "ConversaLoja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anuncioId" TEXT NOT NULL,
    "compradorId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversaLoja_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "AnuncioLoja" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversaLoja_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConversaLoja_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensagemConversaLoja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensagemConversaLoja_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaLoja" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MensagemConversaLoja_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversaLoja_anuncioId_compradorId_key" ON "ConversaLoja"("anuncioId", "compradorId");
