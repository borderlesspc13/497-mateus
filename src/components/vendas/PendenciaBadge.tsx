import type { VendaRow } from "@/lib/types/domain";
import {
  countChecklistPendente,
  getPendenciaNivel,
  isChecklistCompleto,
} from "@/lib/vendas/pendencia";

type PendenciaBadgeProps = {
  venda: Pick<VendaRow, "alertaAtivo" | "dataPendencia" | "checklistAtivacao">;
};

function Badge({
  label,
  className,
  title,
}: {
  label: string;
  className: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function PendenciaBadge({ venda }: PendenciaBadgeProps) {
  const nivel = getPendenciaNivel(venda);
  const checklistPendente = countChecklistPendente(venda.checklistAtivacao);
  const checklistOk = isChecklistCompleto(venda.checklistAtivacao);

  return (
    <div className="flex flex-wrap gap-1.5">
      {nivel === "atrasado" ? (
        <Badge
          label="Atrasado"
          className="border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300"
          title={
            venda.dataPendencia
              ? `Pendência desde ${new Date(venda.dataPendencia).toLocaleDateString("pt-BR")}`
              : undefined
          }
        />
      ) : null}
      {nivel === "pendente" ? (
        <Badge
          label="Alerta ativo"
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300"
          title={
            venda.dataPendencia
              ? `Pendência em ${new Date(venda.dataPendencia).toLocaleDateString("pt-BR")}`
              : "Alerta de pós-venda ativo"
          }
        />
      ) : null}
      {!checklistOk ? (
        <Badge
          label={`Ativação ${checklistPendente}/3`}
          className="border-border bg-muted text-muted-foreground"
          title="Itens pendentes no checklist de ativação"
        />
      ) : (
        <Badge
          label="Ativado"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          title="Checklist de ativação completo"
        />
      )}
    </div>
  );
}
