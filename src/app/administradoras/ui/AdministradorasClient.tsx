"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteAdministradora } from "@/actions/administradoras";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { formControlClass, primaryActionClass } from "@/components/ui/list-panel-classes";
import { PremiumDataTable, type GridColDef } from "@/components/ui/PremiumDataTableLazy";
import type { AdministradoraRow } from "@/lib/types/domain";

type AdministradorasClientProps = {
  initialItems: AdministradoraRow[];
};

export default function AdministradorasClient({ initialItems }: AdministradorasClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const hay = `${a.nome} ${a.cnpj} ${a.email ?? ""} ${a.telefone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir administradora?",
      description: "Esta ação não pode ser desfeita. Os planos vinculados podem ser afetados.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    setError(null);
    setDeletingId(id);
    try {
      await deleteAdministradora(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: GridColDef<AdministradoraRow>[] = useMemo(
    () => [
      {
        field: "nome",
        headerName: "Nome",
        flex: 1.2,
        minWidth: 160,
        renderCell: ({ value }) => (
          <span className="font-medium text-foreground">{value as string}</span>
        ),
      },
      {
        field: "cnpj",
        headerName: "CNPJ",
        width: 150,
      },
      {
        field: "contatoPrincipal",
        headerName: "Contato",
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => row.contatoPrincipal || "—",
        renderCell: ({ row }) => (
          <div className="leading-5 py-1">
            <div className="text-foreground">{row.contatoPrincipal || "—"}</div>
            <div className="text-xs text-muted-foreground">{row.email || "—"}</div>
          </div>
        ),
      },
      {
        field: "enderecoCidade",
        headerName: "Cidade/UF",
        width: 130,
        valueGetter: (_value, row) =>
          `${row.enderecoCidade || "—"}${row.enderecoUf ? `/${row.enderecoUf}` : ""}`,
      },
      {
        field: "createdAt",
        headerName: "Criado em",
        width: 120,
        valueFormatter: (value) =>
          value ? new Date(value as string).toLocaleDateString("pt-BR") : "—",
      },
      {
        field: "actions",
        headerName: "Ações",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <div className="flex h-full items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/planos?administradoraId=${encodeURIComponent(row.id)}`}>Planos</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/administradoras/${row.id}`}>Editar</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingId === row.id}
              onClick={() => void onDelete(row.id)}
            >
              {deletingId === row.id ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        ),
      },
    ],
    [deletingId],
  );

  return (
    <DataListPanel
      toolbar={
        <>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CNPJ, e-mail..."
            className={formControlClass("lg")}
          />
          <Button asChild>
            <Link href="/administradoras/nova">Nova administradora</Link>
          </Button>
        </>
      }
      error={
        error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhuma administradora cadastrada" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre a primeira administradora parceira do sistema."
              : "Tente outro termo na busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/administradoras/nova" className={primaryActionClass()}>
                Nova administradora
              </Link>
            ) : undefined
          }
        />
      ) : (
        <PremiumDataTable rows={filtered} columns={columns} pageSize={15} />
      )}
    </DataListPanel>
  );
}
