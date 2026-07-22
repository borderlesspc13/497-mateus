"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsorciadoFichaHero } from "@/components/consorciados/ConsorciadoFichaHero";
import { ConsorciadoHistoricoTabs } from "@/components/consorciados/ConsorciadoHistoricoTabs";
import { ConsorciadoProdutosTable } from "@/components/consorciados/ConsorciadoProdutosTable";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import { getConsorciado, listVendasByConsorciado } from "@/actions/consorciados";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DetailPageSkeleton } from "@/components/ui/Skeleton";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";

type FichaConsorciadoProps = {
  id: string;
};

export default function FichaConsorciado({ id }: FichaConsorciadoProps) {
  const [consorciado, setConsorciado] = useState<ConsorciadoRow | null>(null);
  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenda, setSelectedVenda] = useState<VendaRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void Promise.all([getConsorciado(id), listVendasByConsorciado(id)])
      .then(([item, cotas]) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setConsorciado(item);
        setVendas(cotas);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar ficha.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  function openAtendimento(venda: VendaRow) {
    setSelectedVenda(venda);
    setDrawerOpen(true);
  }

  if (loading) {
    return <DetailPageSkeleton sections={3} />;
  }

  if (notFound || !consorciado) {
    return (
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: "Erro" },
        ]}
        title="Consorciado não encontrado"
        description="Não foi possível carregar este registro."
        actions={
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à consulta
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ConsorciadoFichaHero
        consorciado={consorciado}
        vendas={vendas}
        editHref={`/consorciados/${id}/editar`}
      />

      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

      <ConsorciadoProdutosTable
        consorciado={consorciado}
        vendas={vendas}
        onOpenAtendimento={openAtendimento}
      />

      <ConsorciadoHistoricoTabs consorciado={consorciado} vendas={vendas} />

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultTipoRegistro="POS_VENDA"
      />
    </div>
  );
}
