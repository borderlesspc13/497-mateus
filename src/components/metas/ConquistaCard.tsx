import type { Conquista } from "@/types/metas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ConquistaCardProps = {
  conquista: Conquista;
  desbloqueada: boolean;
  dataDesbloqueio?: string | null;
  faltando?: string | null;
};

function formatData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ConquistaCard({
  conquista,
  desbloqueada,
  dataDesbloqueio,
  faltando,
}: ConquistaCardProps) {
  const ariaLabel = desbloqueada
    ? `Conquista desbloqueada: ${conquista.nome}`
    : `Conquista bloqueada: ${conquista.nome}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            aria-label={ariaLabel}
            className={[
              "flex items-start gap-3 rounded-xl border p-4 transition-all",
              desbloqueada
                ? "border-emerald-200 bg-emerald-50/80 shadow-sm"
                : "border-border bg-muted/50 opacity-70",
            ].join(" ")}
          >
            <span className={`text-2xl ${desbloqueada ? "" : "grayscale"}`} aria-hidden>
              {desbloqueada ? conquista.icone : "🔒"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{conquista.nome}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{conquista.descricao}</p>
              {desbloqueada && dataDesbloqueio ? (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  ✅ desbloqueada em {formatData(dataDesbloqueio)}
                </p>
              ) : null}
              {!desbloqueada && faltando ? (
                <p className="mt-1 text-xs text-muted-foreground">🔒 bloqueada ({faltando})</p>
              ) : null}
              {!desbloqueada && !faltando ? (
                <p className="mt-1 text-xs text-muted-foreground">🔒 bloqueada</p>
              ) : null}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>{conquista.descricao}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
