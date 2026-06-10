import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  // Override createUser so Google OAuth users get condoId, perfil, ativo
  createUser: async (data: { name?: string | null; email: string; emailVerified?: Date | null; image?: string | null }) => {
    const condo = await prisma.condo.findFirst();
    const user = await prisma.user.create({
      data: {
        name: data.name ?? "Usuário",
        email: data.email,
        emailVerified: data.emailVerified ?? null,
        image: data.image ?? null,
        password: "",
        condoId: condo?.id ?? "",
        perfil: "MORADOR",
        ativo: false,
      },
    });
    return user as typeof user & { emailVerified: Date | null };
  },
};

export const authOptions: NextAuthOptions = {
  adapter: adapter as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Identificador", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const id = credentials.email.trim();
        const digits = id.replace(/\D/g, "");

        let user;

        if (id.includes("@")) {
          user = await prisma.user.findUnique({ where: { email: id.toLowerCase() } });
        } else {
          const cpf11 = digits.length === 11
            ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            : null;
          const tel10 = digits.length === 10
            ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
            : null;
          const tel11 = digits.length === 11
            ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
            : null;

          const or: { cpf?: string; telefone?: string }[] = [];
          if (cpf11) or.push({ cpf: cpf11 });
          if (tel10) or.push({ telefone: tel10 });
          if (tel11) or.push({ telefone: tel11 });
          or.push({ cpf: id }, { telefone: id });

          user = await prisma.user.findFirst({ where: { OR: or } });
        }

        if (!user || !user.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.password, user.password);
        if (!senhaValida) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          perfil: user.perfil,
          condoId: user.condoId,
          apartamento: user.apartamento,
          bloco: user.bloco,
          telefone: user.telefone,
          cpf: user.cpf,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (dbUser && !dbUser.ativo) {
          // Auto-ativa se já tem senha (registrou pelo form antes)
          if (dbUser.password) {
            await prisma.user.update({ where: { id: dbUser.id }, data: { ativo: true } });
          } else {
            return "/login?erro=aguardando_aprovacao";
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Re-fetch on session update (e.g. after completing profile)
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { apartamento: true, bloco: true, telefone: true, cpf: true, perfil: true, condoId: true },
        });
        if (dbUser) {
          token.apartamento = dbUser.apartamento;
          token.bloco = dbUser.bloco;
          token.perfilCompleto = ["PORTEIRO", "ADMINISTRADORA"].includes(dbUser.perfil) || !!(dbUser.apartamento && dbUser.bloco && dbUser.telefone && dbUser.cpf);
        }
        return token;
      }

      if (user) {
        if (account?.provider === "credentials") {
          const u = user as typeof user & { perfil: string; condoId: string; apartamento: string | null; bloco: string | null; telefone: string | null; cpf: string | null };
          token.id = u.id;
          token.perfil = u.perfil;
          token.condoId = u.condoId;
          token.apartamento = u.apartamento;
          token.bloco = u.bloco;
          token.perfilCompleto = ["PORTEIRO", "ADMINISTRADORA"].includes(u.perfil) || !!(u.apartamento && u.bloco && u.telefone && u.cpf);
        } else {
          // OAuth: fetch custom fields from DB
          const lookupId = user.id || token.sub;
          const dbUser = lookupId ? await prisma.user.findUnique({
            where: { id: lookupId },
            select: { id: true, perfil: true, condoId: true, apartamento: true, bloco: true, telefone: true, cpf: true },
          }) : null;
          if (dbUser) {
            token.id = dbUser.id;
            token.perfil = dbUser.perfil;
            token.condoId = dbUser.condoId;
            token.apartamento = dbUser.apartamento;
            token.bloco = dbUser.bloco;
            token.perfilCompleto = ["PORTEIRO", "ADMINISTRADORA"].includes(dbUser.perfil) || !!(dbUser.apartamento && dbUser.bloco && dbUser.telefone && dbUser.cpf);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.perfil = token.perfil as string;
        session.user.condoId = token.condoId as string;
        session.user.apartamento = token.apartamento as string | null;
        session.user.bloco = token.bloco as string | null;
        session.user.perfilCompleto = token.perfilCompleto as boolean ?? false;
      }
      return session;
    },
  },
};
