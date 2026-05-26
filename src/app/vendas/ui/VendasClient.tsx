"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { deleteVenda } from "@/actions/vendas";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PendenciaBadge } from "@/components/vendas/PendenciaBadge";
import {
  dangerActionClass,
  dataTableClass,
  formControlClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, VendaRow } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type VendasClientProps = {
  initialItems: VendaRow[];
  initialAdministradoras: AdministradoraMini[];
};

export default function VendasClient({
  initialItems,
  initialAdministradoras,
}: VendasClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | VendaRow["status"]>("");
  const [administradoraId, setAdministradoraId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((v) => {
      if (status && v.status !== status) return false;
      if (administradoraId && v.administradoraId !== administradoraId) return false;
      if (!q) return true;
      const hay = `${v.titulo} ${v.consorciado?.nome ?? ""} ${v.administradora?.nome ?? ""} ${v.plano?.nome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, status, administradoraId]);

  async function onDelete(id: string) {
    if (!confirm("Excluir venda?")) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteVenda(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, consorciado ou administradora..."
            className={formControlClass("lg")}
          />
          <select
            value={administradoraId}
            onChange={(e) => setAdministradoraId(e.target.value)}
            className={formControlClass("md")}
          >
            <option value="">Todas administradoras</option>
            {initialAdministradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={formControlClass("sm")}
          >
            <option value="">Todos status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ENVIADA">Enviada</option>
            <option value="FECHADA">Fechada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <Link href="/vendas/nova" className={primaryActionClass()}>
            Nova venda
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhuma venda cadastrada" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre a primeira venda vinculada a um consorciado e administradora."
              : "Ajuste os filtros ou o termo de busca para ver outros registros."
          }
          action={
            items.length === 0 ? (
              <Link href="/vendas/nova" className={primaryActionClass()}>
                Nova venda
              </Link>
            ) : undefined
          }
        />
      ) : (
      <div className={tableWrapClass()}>
        <table className={dataTableClass()}>
          <thead>
            <tr>
              <th className={tableHeadCellClass()}>Título</th>
              <th className={tableHeadCellClass()}>Consorciado</th>
              <th className={tableHeadCellClass()}>Administradora</th>
              <th className={tableHeadCellClass()}>Plano</th>
              <th className={tableHeadCellClass()}>Status</th>
              <th className={tableHeadCellClass()}>Pós-venda</th>
              <th className={tableHeadCellClass()}>Valor</th>
              <th className={tableHeadCellClass()}>Data da venda</th>
              <th className={tableHeadCellClass()}>Criado em</th>
              <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody>
              {filtered.map((v, index) => (
                <tr key={v.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>{v.titulo}</td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      {v.consorciado ? (
                        <Link
                          href={`/consorciados/${v.consorciado.id}`}
                          className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                        >
                          {v.consorciado.nome}
                        </Link>
                      ) : (
                        <div className="text-zinc-800">—</div>
                      )}
                      {v.consorciado?.documento ? (
                        <div className="text-xs text-zinc-500">{v.consorciado.documento}</div>
                      ) : null}
                    </div>
                  </td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      <Link
                        href={`/administradoras/${v.administradoraId}`}
                        className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                      >
                        {v.administradora?.nome ?? "—"}
                      </Link>
                      <div className="text-xs text-zinc-500">{v.administradora?.cnpj ?? ""}</div>
                    </div>
                  </td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      {v.plano ? (
                        <Link
                          href={`/planos/${v.plano.id}`}
                          className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                        >
                          {v.plano.nome}
                        </Link>
                      ) : (
                        <div className="text-zinc-800">—</div>
                      )}
                      {v.plano?.tipoBem ? (
                        <div className="text-xs text-zinc-500">{v.plano.tipoBem}</div>
                      ) : null}
                    </div>
                  </td>
                  <td className={tableCellClass()}>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className={tableCellClass()}>
                    <PendenciaBadge venda={v} />
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                    {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {v.dataVenda ? new Date(v.dataVenda).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/vendas/${v.id}`} className={secondaryActionClass()}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(v.id)}
                        disabled={deletingId === v.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === v.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}
    </DataListPanel>
  );
}
