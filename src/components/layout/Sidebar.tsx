import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Bell,
  AlertTriangle,
  CalendarDays,
  Users,
  PackageOpen,
  Building2,
  UserPlus,
  Users2,
  BookUser,
  CircleUser,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  perfis: string[];
};

const navItems: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard, perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/avisos",      label: "Avisos",       icon: Bell,            perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/ocorrencias", label: "Ocorrências",  icon: AlertTriangle,   perfis: ["MORADOR","SINDICO","PORTEIRO"] },
  { href: "/reservas",    label: "Reservas",     icon: CalendarDays,    perfis: ["MORADOR","SINDICO"] },
  { href: "/visitantes",  label: "Visitantes",   icon: Users,           perfis: ["MORADOR","PORTEIRO"] },
  { href: "/entregas",           label: "Entregas",   icon: PackageOpen, perfis: ["MORADOR","PORTEIRO"] },
  { href: "/porteiro/diretorio", label: "Diretório",  icon: BookUser,    perfis: ["PORTEIRO","SINDICO"] },
  { href: "/comunidade",         label: "Comunidade", icon: Users2,      perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/moradores",          label: "Moradores",  icon: UserPlus,    perfis: ["SINDICO"] },
  { href: "/perfil",             label: "Meu Perfil", icon: CircleUser,  perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
];

const PERFIL_LABEL: Record<string, string> = {
  MORADOR: "Morador",
  SINDICO: "Síndico",
  PORTEIRO: "Porteiro",
  ADMINISTRADORA: "Administradora",
};

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const perfil = session?.user?.perfil ?? "";

  const itens = navItems.filter((item) => item.perfis.includes(perfil));

  return (
    <aside className="w-60 min-h-screen bg-[#0F172A] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/40 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">Condomínio</p>
            <p className="text-slate-400 text-xs truncate">Gestão Residencial</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {itens.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? router.pathname === "/dashboard"
              : router.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn("sidebar-item", isActive ? "sidebar-item-active" : "sidebar-item-inactive")}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{session?.user?.name}</p>
            <p className="text-slate-400 text-xs">{PERFIL_LABEL[perfil] ?? perfil}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
