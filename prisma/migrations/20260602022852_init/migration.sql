-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'MORADOR',
    "apartamento" TEXT,
    "bloco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "condoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Condo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiradoEm" DATETIME,
    "condoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    CONSTRAINT "Aviso_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "observacoes" TEXT,
    "abertaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    "condoId" TEXT NOT NULL,
    "moradorId" TEXT NOT NULL,
    CONSTRAINT "Ocorrencia_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ocorrencia_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AreaComum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "capacidade" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "condoId" TEXT NOT NULL,
    CONSTRAINT "AreaComum_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaId" TEXT NOT NULL,
    "moradorId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "Reserva_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaComum" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutorizacaoVisitante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeVisitante" TEXT NOT NULL,
    "documento" TEXT,
    "dataValida" DATETIME NOT NULL,
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "moradorId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutorizacaoVisitante_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitaRegistrada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "autorizacaoId" TEXT NOT NULL,
    "porteiroId" TEXT NOT NULL,
    "entradaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saidaEm" DATETIME,
    "observacoes" TEXT,
    CONSTRAINT "VisitaRegistrada_autorizacaoId_fkey" FOREIGN KEY ("autorizacaoId") REFERENCES "AutorizacaoVisitante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VisitaRegistrada_porteiroId_fkey" FOREIGN KEY ("porteiroId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moradorId" TEXT NOT NULL,
    "porteiroId" TEXT NOT NULL,
    "remetente" TEXT,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_RETIRADA',
    "recebidaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradaEm" DATETIME,
    "observacoes" TEXT,
    CONSTRAINT "Entrega_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_porteiroId_fkey" FOREIGN KEY ("porteiroId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
