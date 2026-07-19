import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { listVendasPaginated } from "@/actions/vendas";
import { PageLoading } from "@/components/ui/PageLoading";
import ControleCotasClient from "../ui/ControleCotasClient";

async function InadimplenciaData() {
  const [page, administradoras, equipes] = await Promise.all([
    listVendasPaginated({ statusOperacional: "INADIMPLENTE" }),
    listAdministradoras(),
    listEquipesMini(),
  ]);

  return (
    <ControleCotasClient
      modo="inadimplencia"
      initialPage={page}
      filterOptions={{
        administradoras: administradoras.map((item) => ({
          id: item.id,
          nome: item.nome,
          cnpj: item.cnpj,
        })),
        equipes,
      }}
    />
  );
}

export default function ControleInadimplenciaPage() {
  return (
    <Suspense fallback={<PageLoading rows={8} columns={6} withHeader={false} />}>
      <InadimplenciaData />
    </Suspense>
  );
}
