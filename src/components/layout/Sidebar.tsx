import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  perfis: string[];
};

const navItems: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",   icon: LayoutDashboard, perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/avisos",             label: "Avisos",       icon: Bell,            perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/ocorrencias",        label: "Ocorrências",  icon: AlertTriangle,   perfis: ["MORADOR","SINDICO","PORTEIRO"] },
  { href: "/reservas",           label: "Reservas",     icon: CalendarDays,    perfis: ["MORADOR","SINDICO"] },
  { href: "/visitantes",         label: "Visitantes",   icon: Users,           perfis: ["MORADOR","PORTEIRO"] },
  { href: "/entregas",           label: "Entregas",     icon: PackageOpen,     perfis: ["MORADOR","PORTEIRO"] },
  { href: "/porteiro/diretorio", label: "Diretório",    icon: BookUser,        perfis: ["PORTEIRO","SINDICO"] },
  { href: "/comunidade",         label: "Comunidade",   icon: Users2,          perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
  { href: "/moradores",          label: "Moradores",    icon: UserPlus,        perfis: ["SINDICO"] },
  { href: "/perfil",             label: "Meu Perfil",   icon: CircleUser,      perfis: ["MORADOR","SINDICO","PORTEIRO","ADMINISTRADORA"] },
];

const PERFIL_LABEL: Record<string, string> = {
  MORADOR:        "Morador",
  SINDICO:        "Síndico",
  PORTEIRO:       "Porteiro",
  ADMINISTRADORA: "Administradora",
};

const PERFIL_BADGE: Record<string, string> = {
  MORADOR:        "bg-indigo-500/20 text-indigo-300",
  SINDICO:        "bg-amber-500/20 text-amber-300",
  PORTEIRO:       "bg-emerald-500/20 text-emerald-300",
  ADMINISTRADORA: "bg-violet-500/20 text-violet-300",
};

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const perfil = session?.user?.perfil ?? "";
  const [confirmLogout, setConfirmLogout] = useState(false);

  const itens = navItems.filter((item) => item.perfis.includes(perfil));

  return (
    <aside className="hidden lg:flex w-60 min-h-screen bg-[#0D1225] flex-col flex-shrink-0 relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-transparent to-violet-950/20 pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 blur-sm -z-10" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight tracking-tight">Condomínio</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Gestão Residencial</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 px-3 mb-2">Menu</p>
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
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="relative px-3 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ring-2 ring-white/10">
              <span className="text-white text-xs font-bold">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">{session?.user?.name}</p>
            <span className={cn(
              "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5",
              PERFIL_BADGE[perfil] ?? "bg-slate-500/20 text-slate-400"
            )}>
              {PERFIL_LABEL[perfil] ?? perfil}
            </span>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex-shrink-0"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Sair da conta"
        message="Tem certeza que deseja sair? Você precisará fazer login novamente."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        onCancel={() => setConfirmLogout(false)}
      />
    </aside>
  );
}
