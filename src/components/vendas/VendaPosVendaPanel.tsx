"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import {
  addHistoricoAtendimento,
  subscribeHistoricoAtendimento,
  subscribeVendaPosVenda,
  updateChecklistItem,
  updateVendaPendencia,
  type VendaPosVendaState,
} from "@/lib/firestore/vendas-posvenda-client";
import type {
  ChecklistAtivacao,
  HistoricoAtendimentoRow,
  HistoricoAtendimentoTipo,
  VendaRow,
} from "@/lib/types/domain";
import { isChecklistCompleto } from "@/lib/vendas/pendencia";
import { CHECKLIST_ATIVACAO_ITEMS, HISTORICO_TIPO_LABELS } from "@/lib/vendas/pos-venda";

type VendaPosVendaPanelProps = {
  vendaId: string;
  initial: Pick<VendaRow, "checklistAtivacao" | "dataPendencia" | "alertaAtivo">;
};

function dateToInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tipoBadgeClass(tipo: HistoricoAtendimentoTipo) {
  switch (tipo) {
    case "chamada":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "email":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "nota":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    case "atualizacao":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

function TimelineItem({ item }: { item: HistoricoAtendimentoRow }) {
  return (
    <li className="relative pl-8 pb-8 last:pb-0">
      <span
        className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-zinc-900 shadow-sm ring-2 ring-zinc-200"
        aria-hidden
      />
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={[
              "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
              tipoBadgeClass(item.tipo),
            ].join(" ")}
          >
            {HISTORICO_TIPO_LABELS[item.tipo]}
          </span>
          <time className="text-xs font-medium text-zinc-500">{formatDateTime(item.data)}</time>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{item.descricao}</p>
      </div>
    </li>
  );
}

export function VendaPosVendaPanel({ vendaId, initial }: VendaPosVendaPanelProps) {
  const [posVenda, setPosVenda] = useState<VendaPosVendaState>({
    checklistAtivacao: initial.checklistAtivacao,
    dataPendencia: initial.dataPendencia,
    alertaAtivo: initial.alertaAtivo,
  });
  const [historico, setHistorico] = useState<HistoricoAtendimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingChecklist, setSavingChecklist] = useState<keyof ChecklistAtivacao | null>(null);
  const [savingPendencia, setSavingPendencia] = useState(false);
  const [savingHistorico, setSavingHistorico] = useState(false);

  const [dataPendenciaInput, setDataPendenciaInput] = useState(dateToInputValue(initial.dataPendencia));
  const [alertaAtivoInput, setAlertaAtivoInput] = useState(initial.alertaAtivo);
  const [historicoTipo, setHistoricoTipo] = useState<HistoricoAtendimentoTipo>("nota");
  const [historicoDescricao, setHistoricoDescricao] = useState("");

  useEffect(() => {
    setLoading(true);
    let ready = 0;
    const markReady = () => {
      ready += 1;
      if (ready >= 2) setLoading(false);
    };

    const unsubVenda = subscribeVendaPosVenda(
      vendaId,
      (state) => {
        setPosVenda(state);
        setDataPendenciaInput(dateToInputValue(state.dataPendencia));
        setAlertaAtivoInput(state.alertaAtivo);
        markReady();
      },
      (error) => {
        setSyncError(error.message);
        markReady();
      },
    );

    const unsubHistorico = subscribeHistoricoAtendimento(
      vendaId,
      (items) => {
        setHistorico(items);
        markReady();
      },
      (error) => {
        setSyncError(error.message);
        markReady();
      },
    );

    return () => {
      unsubVenda();
      unsubHistorico();
    };
  }, [vendaId]);

  async function onToggleChecklist(field: keyof ChecklistAtivacao, value: boolean) {
    setActionError(null);
    setSavingChecklist(field);
    try {
      await updateChecklistItem(vendaId, field, value);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao atualizar checklist.");
    } finally {
      setSavingChecklist(null);
    }
  }

  async function onSavePendencia() {
    setActionError(null);
    setSavingPendencia(true);
    try {
      const dataPendencia = dataPendenciaInput
        ? new Date(`${dataPendenciaInput}T12:00:00.000Z`).toISOString()
        : null;
      await updateVendaPendencia(vendaId, dataPendencia, alertaAtivoInput);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao salvar pendência.");
    } finally {
      setSavingPendencia(false);
    }
  }

  async function onAddHistorico(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    if (!historicoDescricao.trim()) {
      setActionError("Informe a descrição do atendimento.");
      return;
    }
    setSavingHistorico(true);
    try {
      await addHistoricoAtendimento(vendaId, historicoTipo, historicoDescricao);
      setHistoricoDescricao("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao registrar atendimento.");
    } finally {
      setSavingHistorico(false);
    }
  }

  const checklistCompleto = isChecklistCompleto(posVenda.checklistAtivacao);

  if (loading) {
    return (
      <div className="mt-8 space-y-5">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Pós-venda e CRM operacional</h2>
        <p className="mt-1.5 text-sm leading-6 text-zinc-600">
          Ativação, pendências e histórico de atendimento sincronizados em tempo real com o Firestore.
        </p>
      </div>

      {(syncError || actionError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError ?? syncError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${panelClass()} p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Checklist de ativação</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Marque os marcos de ativação do consorciado após a venda.
              </p>
            </div>
            <span
              className={[
                "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold",
                checklistCompleto
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900",
              ].join(" ")}
            >
              {checklistCompleto ? "Completo" : "Em andamento"}
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {CHECKLIST_ATIVACAO_ITEMS.map((item) => {
              const checked = posVenda.checklistAtivacao[item.key];
              const isSaving = savingChecklist === item.key;
              return (
                <li key={item.key}>
                  <label
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                      checked
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
                      isSaving ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isSaving}
                      onChange={(e) => void onToggleChecklist(item.key, e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                    />
                    <span className="text-sm font-medium text-zinc-800">{item.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${panelClass()} p-6`}>
          <h3 className="text-base font-semibold text-zinc-900">Agenda e alertas</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Defina uma data de pendência e ative alertas para a equipa acompanhar.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <div className="mb-1.5 text-xs font-medium text-zinc-600">Data de pendência</div>
              <input
                type="date"
                value={dataPendenciaInput}
                onChange={(e) => setDataPendenciaInput(e.target.value)}
                className={formControlClass()}
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3.5">
              <input
                type="checkbox"
                checked={alertaAtivoInput}
                onChange={(e) => setAlertaAtivoInput(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
              />
              <span className="text-sm font-medium text-zinc-800">Alerta de pós-venda ativo</span>
            </label>

            <button
              type="button"
              onClick={() => void onSavePendencia()}
              disabled={savingPendencia}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingPendencia ? "Salvando..." : "Salvar agenda e alerta"}
            </button>
          </div>
        </section>
      </div>

      <section className={`${panelClass()} p-6`}>
        <h3 className="text-base font-semibold text-zinc-900">Histórico de atendimento</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Registre chamadas, e-mails e anotações sobre o relacionamento com o consorciado.
        </p>

        <form onSubmit={(e) => void onAddHistorico(e)} className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="block lg:col-span-1">
            <div className="mb-1.5 text-xs font-medium text-zinc-600">Tipo</div>
            <select
              value={historicoTipo}
              onChange={(e) => setHistoricoTipo(e.target.value as HistoricoAtendimentoTipo)}
              className={formControlClass()}
            >
              {(Object.keys(HISTORICO_TIPO_LABELS) as HistoricoAtendimentoTipo[]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {HISTORICO_TIPO_LABELS[tipo]}
                </option>
              ))}
            </select>
          </label>

          <label className="block lg:col-span-2">
            <div className="mb-1.5 text-xs font-medium text-zinc-600">
              Descrição <span className="text-red-600">*</span>
            </div>
            <textarea
              value={historicoDescricao}
              onChange={(e) => setHistoricoDescricao(e.target.value)}
              placeholder="Resumo da interação, combinados, próximos passos..."
              className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white p-3.5 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/60"
            />
          </label>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={savingHistorico}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingHistorico ? "Registrando..." : "Adicionar ao histórico"}
            </button>
          </div>
        </form>

        <div className="mt-8">
          {historico.length === 0 ? (
            <EmptyState
              title="Nenhum atendimento registrado"
              description="Adicione a primeira anotação para iniciar a linha do tempo desta venda."
            />
          ) : (
            <ol className="relative border-l-2 border-zinc-200 pl-2">
              {historico.map((item) => (
                <TimelineItem key={item.id} item={item} />
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
