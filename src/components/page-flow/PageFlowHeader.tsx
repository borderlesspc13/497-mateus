"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type PageCrumb = { label: string; href?: string };

type PageFlowHeaderProps = {
  crumbs: PageCrumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Cabeçalho consistente entre telas: trilha (breadcrumb), título e ações à direita.
 */
export function PageFlowHeader({
  crumbs,
  title,
  description,
  actions,
}: PageFlowHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-3">
        <nav
          className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground"
          aria-label="Trilha de navegação"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3 shrink-0 text-border" aria-hidden />
              ) : null}
              {c.href ? (
                <Link
                  href={c.href}
                  className="rounded-sm underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="space-y-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{actions}</div>
      ) : null}
    </header>
  );
}
