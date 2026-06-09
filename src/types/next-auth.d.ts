import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      perfil: string;
      condoId: string;
      apartamento: string | null;
      bloco: string | null;
      perfilCompleto: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    perfil: string;
    condoId: string;
    apartamento: string | null;
    bloco: string | null;
    perfilCompleto: boolean;
  }
}
