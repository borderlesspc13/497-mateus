"use client";

import { useEffect, useMemo, useState } from "react";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PosVendaBadge } from "@/components/ui/PosVendaBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { StatusInconsistencia, StatusPosVenda, VendaRow, VendaStatus } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

export type ControleModo = "inadimplencia" | "inconsistencia" | "pos-venda";

type ControleCotasClientProps = {
  modo: ControleModo;
  initialItems: VendaRow[];
};

export default function ControleCotasClient({ modo, initialItems }: ControleCotasClientProps) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | VendaStatus>(
    modo === "inadimplencia" ? "INADIMPLENTE" : "",
  );
  const [inconsistenciaFilter, setInconsistenciaFilter] = useState<"" | StatusInconsistencia>(
    modo === "inconsistencia" ? "INCONSISTENTE" : "",
  );
  const [posVendaFilter, setPosVendaFilter] = useState<"" | StatusPosVenda>(
    modo === "pos-venda" ? "PENDENTE" : "",
  );
  const [selectedVenda, setSelectedVenda] = useState<VendaRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((v) => {
      if (modo === "inadimplencia" && statusFilter && v.status !== statusFilter) return false;
      if (modo === "inconsistencia" && inconsistenciaFilter && v.statusInconsistencia !== inconsistenciaFilter) {
        return false;
      }
      if (modo === "pos-venda" && posVendaFilter && v.statusPosVenda !== posVendaFilter) return false;
      if (!q) return true;
      const hay = `${v.contrato} ${v.grupo} ${v.cota} ${v.consorciado?.nome ?? ""} ${v.equipe?.nome ?? ""} ${v.vendedor?.nome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter, inconsistenciaFilter, posVendaFilter, modo]);

  function openDrawer(venda: VendaRow) {
    setSelectedVenda(venda);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function onPosVendaCompleted(vendaId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === vendaId ? { ...item, statusPosVenda: "FEITO" as const } : item,
      ),
    );
    setSelectedVenda((current) =>
      current?.id === vendaId ? { ...current, statusPosVenda: "FEITO" } : current,
    );
  }

  const defaultTipo =
    modo === "inconsistencia"
      ? ("INCONSISTENCIA" as const)
      : modo === "pos-venda"
        ? ("POS_VENDA" as const)
        : ("COBRANCA" as const);

  const emptyDescription =
    modo === "inconsistencia"
      ? "Ajuste o filtro ou marque cotas como inconsistentes na operação diária."
      : modo === "pos-venda"
        ? "Não há vendas recentes nem pendentes de pós-venda com os filtros atuais."
        : "Ajuste o filtro de status ou o termo de busca.";

  return (
    <>
      <DataListPanel
        toolbar={
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar contrato, grupo, cota, consorciado..."
              className={formControlClass("lg")}
            />
            {modo === "inadimplencia" ? (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className={formControlClass("md")}
              >
                <option value="">Todos os status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INADIMPLENTE">Inadimplente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            ) : null}
            {modo === "inconsistencia" ? (
              <select
                value={inconsistenciaFilter}
                onChange={(e) =>
                  setInconsistenciaFilter(e.target.value as typeof inconsistenciaFilter)
                }
                className={formControlClass("md")}
              >
                <option value="">Todas</option>
                <option value="INCONSISTENTE">Inconsistentes</option>
                <option value="CONSISTENTE">Consistentes</option>
              </select>
            ) : null}
            {modo === "pos-venda" ? (
              <select
                value={posVendaFilter}
                onChange={(e) => setPosVendaFilter(e.target.value as typeof posVendaFilter)}
                className={formControlClass("md")}
              >
                <option value="">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="FEITO">Feitos</option>
              </select>
            ) : null}
          </>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title="Nenhuma cota encontrada" description={emptyDescription} />
        ) : (
          <div className={tableWrapClass()}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Contrato</th>
                  <th className={tableHeadCellClass()}>Grupo / Cota</th>
                  <th className={tableHeadCellClass()}>Consorciado</th>
                  <th className={tableHeadCellClass()}>Status</th>
                  {modo === "inconsistencia" ? (
                    <th className={tableHeadCellClass()}>Inconsistência</th>
                  ) : null}
                  {modo === "pos-venda" ? (
                    <th className={tableHeadCellClass()}>Pós-venda</th>
                  ) : null}
                  <th className={tableHeadCellClass()}>Equipe</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                  <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, index) => (
                  <tr
                    key={v.id}
                    className={`${tableRowClass(index)} cursor-pointer hover:bg-zinc-50/80`}
                    onClick={() => openDrawer(v)}
                  >
                    <td className={`${tableCellClass()} font-medium text-zinc-900`}>{v.contrato}</td>
                    <td className={tableCellClass()}>
                      {v.grupo} / {v.cota}
                      <div className="text-xs text-zinc-500">Venc. dia {v.dataVencimento}</div>
                    </td>
                    <td className={tableCellClass()}>{v.consorciado?.nome ?? "—"}</td>
                    <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={v.status} />
                    </td>
                    {modo === "inconsistencia" ? (
                      <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                        <InconsistenciaBadge status={v.statusInconsistencia} />
                      </td>
                    ) : null}
                    {modo === "pos-venda" ? (
                      <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                        <PosVendaBadge status={v.statusPosVenda} />
                      </td>
                    ) : null}
                    <td className={tableCellClass()}>{v.equipe?.nome ?? "—"}</td>
                    <td className={`${tableCellClass()} tabular-nums`}>
                      {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                    </td>
                    <td
                      className={`${tableCellClass()} pr-0 text-right`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openDrawer(v)}
                        className={secondaryActionClass()}
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataListPanel>

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={closeDrawer}
        showInconsistenciaControls={modo === "inconsistencia"}
        showPosVendaControls={modo === "pos-venda"}
        defaultTipoRegistro={defaultTipo}
        onPosVendaCompleted={modo === "pos-venda" ? onPosVendaCompleted : undefined}
      />
    </>
  );
}
