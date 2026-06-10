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
  Users2,
  UserPlus,
  CircleUser,
  BookUser,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const MOBILE_NAV: Record<string, NavItem[]> = {
  MORADOR: [
    { href: "/dashboard",   label: "Início",    icon: LayoutDashboard },
    { href: "/avisos",      label: "Avisos",    icon: Bell },
    { href: "/reservas",    label: "Reservas",  icon: CalendarDays },
    { href: "/visitantes",  label: "Visitantes",icon: Users },
    { href: "/perfil",      label: "Perfil",    icon: CircleUser },
  ],
  SINDICO: [
    { href: "/dashboard",   label: "Início",    icon: LayoutDashboard },
    { href: "/avisos",      label: "Avisos",    icon: Bell },
    { href: "/ocorrencias", label: "Problemas", icon: AlertTriangle },
    { href: "/moradores",   label: "Moradores", icon: UserPlus },
    { href: "/perfil",      label: "Perfil",    icon: CircleUser },
  ],
  PORTEIRO: [
    { href: "/dashboard",        label: "Início",    icon: LayoutDashboard },
    { href: "/visitantes",       label: "Visitantes",icon: Users },
    { href: "/entregas",         label: "Entregas",  icon: PackageOpen },
    { href: "/porteiro/diretorio", label: "Diretório",icon: BookUser },
    { href: "/perfil",           label: "Perfil",    icon: CircleUser },
  ],
  ADMINISTRADORA: [
    { href: "/dashboard",   label: "Início",    icon: LayoutDashboard },
    { href: "/avisos",      label: "Avisos",    icon: Bell },
    { href: "/ocorrencias", label: "Problemas", icon: AlertTriangle },
    { href: "/comunidade",  label: "Comunidade",icon: Users2 },
    { href: "/perfil",      label: "Perfil",    icon: CircleUser },
  ],
};

export default function MobileNav() {
  const { data: session } = useSession();
  const router = useRouter();
  const perfil = session?.user?.perfil ?? "MORADOR";
  const items = MOBILE_NAV[perfil] ?? MOBILE_NAV.MORADOR;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 pb-safe shadow-[0_-2px_20px_rgba(0,0,0,0.07)]">
      <div className="flex items-stretch max-w-lg mx-auto">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? router.pathname === "/dashboard"
              : router.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("mobile-nav-item", isActive ? "text-indigo-600" : "text-slate-400")}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-150",
                isActive ? "bg-indigo-50 scale-110" : "hover:bg-slate-100"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_1px_4px_rgba(99,102,241,0.35)]")} />
              </div>
              <span className={cn(
                "text-[9.5px] font-semibold tracking-wide leading-none",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
