"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { deletePlano } from "@/actions/planos";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  dangerActionClass,
  dataTableClass,
  formControlClass,
  panelClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, PlanoRow } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type PlanosClientProps = {
  initialItems: PlanoRow[];
  initialAdministradoras: AdministradoraMini[];
};

export default function PlanosClient({
  initialItems,
  initialAdministradoras,
}: PlanosClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [administradoraId, setAdministradoraId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const fromUrl = searchParams.get("administradoraId");
    if (fromUrl) setAdministradoraId(fromUrl);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (administradoraId && p.administradoraId !== administradoraId) return false;
      if (!q) return true;
      const hay = `${p.nome} ${p.tipoBem} ${p.administradora?.nome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, administradoraId]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir este plano?",
      description: "Esta ação não pode ser desfeita.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await deletePlano(id);
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
            placeholder="Buscar por nome, tipo de bem, administradora..."
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
          <Link href="/planos/nova" className={primaryActionClass()}>
            Novo plano
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhum plano cadastrado" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre planos vinculados às administradoras parceiras."
              : "Ajuste os filtros ou o termo de busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/planos/nova" className={primaryActionClass()}>
                Novo plano
              </Link>
            ) : undefined
          }
        />
      ) : (
      <div className={tableWrapClass()}>
        <table className={dataTableClass()}>
          <thead>
            <tr>
              <th className={tableHeadCellClass()}>Nome</th>
              <th className={tableHeadCellClass()}>Administradora</th>
              <th className={tableHeadCellClass()}>Tipo de bem</th>
              <th className={tableHeadCellClass()}>Crédito</th>
              <th className={tableHeadCellClass()}>Comissão</th>
              <th className={tableHeadCellClass()}>Parcelas</th>
              <th className={tableHeadCellClass()}>Estorno</th>
              <th className={tableHeadCellClass()}>Criado em</th>
              <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody>
              {filtered.map((p, index) => (
                <tr key={p.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-foreground`}>{p.nome}</td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      <Link
                        href={`/administradoras/${p.administradoraId}`}
                        className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {p.administradora?.nome ?? "—"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.administradora?.cnpj ?? ""}</div>
                    </div>
                  </td>
                  <td className={tableCellClass()}>{p.tipoBem}</td>
                  <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                    {formatMoneyPtBrFromCentavos(p.valorCreditoCentavos)}
                  </td>
                  <td className={`${tableCellClass()} tabular-nums`}>
                    {p.percentualComissao != null
                      ? `${p.percentualComissao.toLocaleString("pt-BR")}%`
                      : "—"}
                  </td>
                  <td className={tableCellClass()}>
                    {p.parcelasRecebimento ?? "—"}
                  </td>
                  <td className={`${tableCellClass()} tabular-nums`}>
                    {p.diasParaEstorno != null ? `${p.diasParaEstorno} dias` : "—"}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/planos/${p.id}`} className={secondaryActionClass()}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(p.id)}
                        disabled={deletingId === p.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === p.id ? "Excluindo..." : "Excluir"}
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
