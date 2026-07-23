"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateVendaStatusInconsistencia, updateVendaStatusPosVenda } from "@/actions/vendas";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PosVendaBadge } from "@/components/ui/PosVendaBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formControlClass } from "@/components/ui/list-panel-classes";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  addHistoricoAtendimentoUniversal,
  subscribeHistoricoAtendimentoUniversal,
} from "@/lib/firestore/vendas-historico-client";
import type {
  HistoricoAtendimentoUniversalRow,
  StatusInconsistencia,
  StatusPosVenda,
  TipoRegistroAtendimento,
  VendaRow,
} from "@/lib/types/domain";
import {
  STATUS_INCONSISTENCIA_LABELS,
  TIPO_REGISTRO_LABELS,
  TIPO_REGISTRO_OPTIONS,
} from "@/lib/vendas/atendimento";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type VendaAtendimentoDrawerProps = {
  venda: VendaRow | null;
  open: boolean;
  onClose: () => void;
  showInconsistenciaControls?: boolean;
  showPosVendaControls?: boolean;
  defaultTipoRegistro?: TipoRegistroAtendimento;
  onPosVendaCompleted?: (vendaId: string) => void;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function tipoRegistroClass(tipo: TipoRegistroAtendimento) {
  switch (tipo) {
    case "ATENDIMENTO":
      return "border-primary/30 bg-primary/10 text-foreground";
    case "COBRANCA":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "COBRANCA_WHATSAPP":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
    case "POS_VENDA":
      return "border-sky-500/30 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";
    case "INCONSISTENCIA":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
}

function TimelineEntry({ item }: { item: HistoricoAtendimentoUniversalRow }) {
  return (
    <li className="relative pl-7 pb-6 last:pb-0">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card"
        aria-hidden
      />
      <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={[
              "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold uppercase tracking-wide",
              tipoRegistroClass(item.tipoRegistro),
            ].join(" ")}
          >
            {TIPO_REGISTRO_LABELS[item.tipoRegistro]}
          </span>
          <time className="text-xs tabular-nums text-muted-foreground" dateTime={item.dataRegistro}>
            {formatDateTime(item.dataRegistro)}
          </time>
        </div>
        {item.usuarioNome ? (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            Registrado por <span className="text-foreground/80">{item.usuarioNome}</span>
          </p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {item.observacao}
        </p>
      </div>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function VendaAtendimentoDrawer({
  venda,
  open,
  onClose,
  showInconsistenciaControls = false,
  showPosVendaControls = false,
  defaultTipoRegistro = "COBRANCA",
  onPosVendaCompleted,
}: VendaAtendimentoDrawerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [historico, setHistorico] = useState<HistoricoAtendimentoUniversalRow[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [historicoError, setHistoricoError] = useState<string | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistroAtendimento>(defaultTipoRegistro);
  const [observacao, setObservacao] = useState("");
  const [savingRegistro, setSavingRegistro] = useState(false);
  const [savingInconsistencia, setSavingInconsistencia] = useState(false);
  const [statusInconsistencia, setStatusInconsistencia] =
    useState<StatusInconsistencia>("CONSISTENTE");
  const [statusPosVenda, setStatusPosVenda] = useState<StatusPosVenda>("PENDENTE");
  const [marcarPosVendaFeito, setMarcarPosVendaFeito] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !venda) return;
    setTipoRegistro(defaultTipoRegistro);
    setObservacao("");
    setFormError(null);
    setStatusInconsistencia(venda.statusInconsistencia);
    setStatusPosVenda(venda.statusPosVenda);
    setMarcarPosVendaFeito(false);
    setLoadingHistorico(true);
    setHistoricoError(null);

    const unsub = subscribeHistoricoAtendimentoUniversal(
      venda.id,
      (items) => {
        setHistorico(items);
        setLoadingHistorico(false);
      },
      (error) => {
        setHistoricoError(error.message);
        setLoadingHistorico(false);
      },
    );
    return unsub;
  }, [open, venda, defaultTipoRegistro]);

  async function onAddRegistro() {
    if (!venda) return;
    setFormError(null);
    setSavingRegistro(true);
    try {
      const tipo = showPosVendaControls ? ("POS_VENDA" as const) : tipoRegistro;
      const autor = user
        ? {
            usuarioId: user.uid,
            usuarioNome: user.displayName?.trim() || user.email || "Usuário",
          }
        : null;
      await addHistoricoAtendimentoUniversal(
        venda.id,
        venda.numeroContrato,
        tipo,
        observacao,
        autor,
      );

      if (showPosVendaControls && marcarPosVendaFeito && statusPosVenda !== "FEITO") {
        const updated = await updateVendaStatusPosVenda(venda.id, "FEITO");
        setStatusPosVenda(updated.statusPosVenda);
        onPosVendaCompleted?.(venda.id);
      }

      setObservacao("");
      setMarcarPosVendaFeito(false);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar registro.");
    } finally {
      setSavingRegistro(false);
    }
  }

  async function onToggleInconsistencia(next: StatusInconsistencia) {
    if (!venda) return;
    setSavingInconsistencia(true);
    setFormError(null);
    try {
      const updated = await updateVendaStatusInconsistencia(venda.id, next);
      setStatusInconsistencia(updated.statusInconsistencia);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao atualizar inconsistência.");
    } finally {
      setSavingInconsistencia(false);
    }
  }

  if (!open || !venda) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venda-atendimento-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <header className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cota / Contrato
              </p>
              <h2
                id="venda-atendimento-modal-title"
                className="mt-0.5 truncate text-lg font-semibold text-foreground"
              >
                {venda.numeroContrato}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Grupo {venda.grupo} · Cota {venda.cota} · Venc. dia {venda.dataVencimento}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={venda.statusOperacional} />
            <InconsistenciaBadge status={statusInconsistencia} />
            {showPosVendaControls ? <PosVendaBadge status={statusPosVenda} /> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <dt className="text-muted-foreground">Consorciado</dt>
              <dd className="font-medium text-foreground/80">{venda.consorciado?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Valor</dt>
              <dd className="font-medium tabular-nums text-foreground/80">
                {formatMoneyPtBrFromCentavos(venda.valorCentavos)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Equipe</dt>
              <dd className="font-medium text-foreground/80">{venda.equipe?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vendedor</dt>
              <dd className="font-medium text-foreground/80">{venda.vendedor?.nome ?? "—"}</dd>
            </div>
          </dl>
          <Link
            href={`/vendas/${venda.id}`}
            className="mt-3 inline-block text-xs font-semibold text-foreground/80 underline-offset-2 hover:underline"
          >
            Abrir ficha completa da venda →
          </Link>
        </header>

        {showInconsistenciaControls ? (
          <div className="shrink-0 border-b border-border bg-muted/50 px-5 py-3">
            <div className="text-xs font-medium text-muted-foreground">Status de inconsistência</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["CONSISTENTE", "INCONSISTENTE"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={savingInconsistencia || statusInconsistencia === value}
                  onClick={() => void onToggleInconsistencia(value)}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                    statusInconsistencia === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground/70 hover:bg-muted/50",
                  ].join(" ")}
                >
                  {STATUS_INCONSISTENCIA_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showPosVendaControls && statusPosVenda === "FEITO" ? (
          <div className="shrink-0 border-b border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Pós-venda concluído para esta venda.
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Timeline de atendimento</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Registros desta cota com o usuário responsável, do mais recente ao mais antigo.
            </p>

            <div className="mt-4">
              {loadingHistorico ? (
                <TimelineSkeleton />
              ) : historicoError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {historicoError}
                </div>
              ) : historico.length === 0 ? (
                <EmptyState
                  title="Nenhum registro ainda"
                  description="Adicione a primeira interação de atendimento, cobrança, pós-venda ou inconsistência abaixo."
                />
              ) : (
                <ol className="ml-1 border-l border-border">
                  {historico.map((item) => (
                    <TimelineEntry key={item.id} item={item} />
                  ))}
                </ol>
              )}
            </div>
          </div>

          <footer className="shrink-0 border-t border-border bg-card px-5 py-4 sm:px-6">
            <div className="text-xs font-medium text-muted-foreground">Novo registro</div>
            <div className="mt-2 grid gap-3">
              {!showPosVendaControls ? (
                <label className="block">
                  <span className="sr-only">Tipo</span>
                  <select
                    value={tipoRegistro}
                    onChange={(e) => setTipoRegistro(e.target.value as TipoRegistroAtendimento)}
                    className={formControlClass()}
                  >
                    {TIPO_REGISTRO_OPTIONS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {TIPO_REGISTRO_LABELS[tipo]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                  Tipo: {TIPO_REGISTRO_LABELS.POS_VENDA}
                </div>
              )}
              <label className="block">
                <span className="sr-only">Observação</span>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder={
                    showPosVendaControls
                      ? "Ex.: Boas-vindas realizadas, checklist de ativação orientado"
                      : "Ex.: 11/12 — enviado WhatsApp cobrando parcela"
                  }
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              {showPosVendaControls && statusPosVenda !== "FEITO" ? (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={marcarPosVendaFeito}
                    onChange={(e) => setMarcarPosVendaFeito(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm leading-snug text-foreground/80">
                    <span className="font-semibold">Pós-venda realizado com sucesso</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Marca esta venda como concluída na fila de pós-venda ao salvar o registro.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
            {formError ? (
              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {formError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void onAddRegistro()}
              disabled={savingRegistro || !observacao.trim()}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {savingRegistro ? "Salvando..." : "Adicionar registro"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
