"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu, Settings, X } from "lucide-react";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  buildBreadcrumbs,
  buildConfigNav,
  buildNavGroups,
  getInitials,
  hasAnyAdminNavModule,
  isConfigSectionActive,
  isNavActive,
  type NavLinkItem,
} from "@/components/app-shell/nav-config";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/auth/roles";
import type { AppModule } from "@/lib/auth/modules";

function NavItem({
  item,
  nested = false,
  onNavigate,
}: {
  item: NavLinkItem;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        nested ? "px-3 py-2" : "px-3 py-2.5",
        active
          ? nested
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "bg-white/10 text-sidebar-foreground shadow-sm"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-sidebar-foreground" : "text-sidebar-muted group-hover:text-sidebar-foreground",
        )}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function ConfigNavGroup({
  onNavigate,
  permissions,
}: {
  onNavigate?: () => void;
  permissions: AppModule[];
}) {
  const pathname = usePathname();
  const sectionActive = isConfigSectionActive(pathname);
  const [open, setOpen] = useState(sectionActive);
  const configNav = buildConfigNav(permissions);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
          sectionActive
            ? "bg-white/10 text-sidebar-foreground"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <span className="flex items-center gap-3">
          <Settings className="size-4 shrink-0" aria-hidden />
          Configurações
        </span>
        <ChevronRight
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-0.5 border-l border-sidebar-border pl-3 ml-4">
        {configNav.map((item) => (
          <NavItem key={item.href} item={item} nested onNavigate={onNavigate} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarNav({
  onNavigate,
  permissions,
}: {
  onNavigate?: () => void;
  permissions: AppModule[];
}) {
  const navGroups = buildNavGroups(permissions);
  const showConfig = hasAnyAdminNavModule(permissions);

  return (
    <nav className="flex flex-col gap-1" aria-label="Menu principal">
      {navGroups.map((group, index) => (
        <div key={group.id} className={index > 0 ? "mt-4" : undefined}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavItem key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
      {showConfig ? (
        <>
          <Separator className="my-3 bg-sidebar-border" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Administração
          </p>
          <ConfigNavGroup onNavigate={onNavigate} permissions={permissions} />
        </>
      ) : null}
    </nav>
  );
}

function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-bold text-sidebar shadow-sm">
        GO
      </div>
      {!compact ? (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-sidebar-foreground">
            Gestão Operacional
          </div>
          <div className="text-xs text-sidebar-muted">Consórcio</div>
        </div>
      ) : null}
    </div>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const items = buildBreadcrumbs(pathname);
  const current = items[items.length - 1];

  return (
    <div className="min-w-0">
      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <p className="truncate text-sm font-semibold text-foreground md:hidden">
        {current?.label ?? "Gestão Operacional"}
      </p>
    </div>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const userLabel = user?.displayName?.trim() || user?.email || "Usuário";
  const userRoleLabel = user?.role ? roleLabel(user.role) : null;
  const userPermissions = user?.permissions ?? [];
  const userInitials = getInitials(userLabel);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background">
      <NavigationProgress />
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[17.5rem] shrink-0 bg-sidebar md:sticky md:top-0 md:flex md:h-svh md:flex-col md:border-r md:border-sidebar-border md:px-5 md:py-6">
          <AppLogo />

          <div className="mt-8 flex-1 overflow-y-auto">
            <SidebarNav permissions={userPermissions} />
          </div>

          <div className="mt-6 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <p className="text-xs font-medium text-sidebar-foreground">Painel administrativo</p>
            <p className="mt-1 text-[11px] leading-5 text-sidebar-muted">
              Gestão de consórcios, vendas e operações em tempo real.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-md">
            <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                  aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
                <Breadcrumbs />
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 sm:block">
                      <div className="max-w-[10rem] truncate text-xs font-semibold text-foreground">
                        {userLabel}
                      </div>
                      {userRoleLabel ? (
                        <div className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {userRoleLabel}
                        </div>
                      ) : null}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="truncate text-sm font-semibold">{userLabel}</p>
                      {user?.email ? (
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void onSignOut()}
                    disabled={signingOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" />
                    {signingOut ? "Saindo..." : "Sair do sistema"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 md:hidden" id="mobile-nav">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
              />
              <div className="absolute left-0 top-0 flex h-full w-[min(19rem,88vw)] flex-col bg-sidebar p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <AppLogo />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="mt-6 flex-1 overflow-y-auto">
                  <SidebarNav
                    permissions={userPermissions}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
