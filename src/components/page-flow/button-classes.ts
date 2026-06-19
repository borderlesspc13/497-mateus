/** Classes compartilhadas (sem "use client") para uso em Server e Client Components. */

export function backLinkClass() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
}

export function primaryCtaClass() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
}
