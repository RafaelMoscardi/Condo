import { ReactNode, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  titulo?: string;
  className?: string;
}

export default function AppShell({ children, titulo, className }: AppShellProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.perfilCompleto === false) {
      router.push("/perfil/completar");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 blur-md -z-10" />
          </div>
          <div className="flex items-center gap-2.5 text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Carregando…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          {/* Left: mobile logo + page title */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-600/25 flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-semibold text-slate-700 tracking-tight">
              {titulo ?? "Condomínio"}
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Mobile: user avatar */}
            <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm ring-2 ring-white">
              <span className="text-white text-xs font-bold">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            {/* Desktop: logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmLogout(true)}
              className="hidden lg:flex text-slate-400 hover:text-slate-700 hover:bg-slate-100 gap-1.5 text-xs h-8 px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className={cn(
          "flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto pb-24 lg:pb-6 page-enter",
          className
        )}>
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

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
    </div>
  );
}
