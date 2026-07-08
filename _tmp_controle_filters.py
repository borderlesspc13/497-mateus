from pathlib import Path

repo = Path(r"D:\borderless\497-mateus\src\lib\firestore\repository.ts")
text = repo.read_text(encoding="utf-8")

old_type = """export type VendasListFilters = {
  statusOperacional?: StatusOperacionalCota;
  statusInconsistencia?: StatusInconsistencia;
  administradoraId?: string;
};"""

new_type = """export type VendasListFilters = {
  statusOperacional?: StatusOperacionalCota;
  statusInconsistencia?: StatusInconsistencia;
  administradoraId?: string;
  planoId?: string;
  equipeId?: string;
  vendedorId?: string;
  dataVendaFrom?: string;
  dataVendaTo?: string;
};"""

if old_type not in text:
    raise SystemExit("VendasListFilters block not found")
text = text.replace(old_type, new_type, 1)

old_build = """function buildVendasPaginatedQuery(filters: VendasListFilters) {
  let q: FirebaseFirestore.Query = db().collection(COLLECTIONS.vendas);

  if (filters.administradoraId) {
    q = q.where("administradoraId", "==", filters.administradoraId);
  }
  if (filters.statusInconsistencia) {
    q = q.where("statusInconsistencia", "==", filters.statusInconsistencia);
  }

  return q.orderBy("dataContrato", "desc").limit(VENDAS_PAGE_SIZE);
}"""

new_build = """function buildVendasPaginatedQuery(filters: VendasListFilters) {
  let q: FirebaseFirestore.Query = db().collection(COLLECTIONS.vendas);

  if (filters.administradoraId) {
    q = q.where("administradoraId", "==", filters.administradoraId);
  }
  if (filters.planoId) {
    q = q.where("planoId", "==", filters.planoId);
  }
  if (filters.equipeId) {
    q = q.where("equipeId", "==", filters.equipeId);
  }
  if (filters.vendedorId) {
    q = q.where("vendedorId", "==", filters.vendedorId);
  }
  if (filters.statusInconsistencia) {
    q = q.where("statusInconsistencia", "==", filters.statusInconsistencia);
  }
  if (filters.dataVendaFrom) {
    q = q.where("dataContrato", ">=", filters.dataVendaFrom);
  }
  if (filters.dataVendaTo) {
    q = q.where("dataContrato", "<=", `${filters.dataVendaTo}T23:59:59.999Z`);
  }

  return q.orderBy("dataContrato", "desc").limit(VENDAS_PAGE_SIZE);
}"""

if old_build not in text:
    raise SystemExit("buildVendasPaginatedQuery block not found")
text = text.replace(old_build, new_build, 1)

old_apply = """function applyVendasListFiltersInMemory(
  vendas: DocWithId<VendaDoc>[],
  filters: VendasListFilters,
): DocWithId<VendaDoc>[] {
  return vendas.filter((venda) => {
    if (filters.administradoraId && venda.administradoraId !== filters.administradoraId) {
      return false;
    }
    if (
      filters.statusInconsistencia &&
      venda.statusInconsistencia !== filters.statusInconsistencia
    ) {
      return false;
    }
    return true;
  });
}"""

new_apply = """function applyVendasListFiltersInMemory(
  vendas: DocWithId<VendaDoc>[],
  filters: VendasListFilters,
): DocWithId<VendaDoc>[] {
  const dataVendaToBound = filters.dataVendaTo
    ? `${filters.dataVendaTo}T23:59:59.999Z`
    : null;

  return vendas.filter((venda) => {
    if (filters.administradoraId && venda.administradoraId !== filters.administradoraId) {
      return false;
    }
    if (filters.planoId && venda.planoId !== filters.planoId) {
      return false;
    }
    if (filters.equipeId && venda.equipeId !== filters.equipeId) {
      return false;
    }
    if (filters.vendedorId && venda.vendedorId !== filters.vendedorId) {
      return false;
    }
    if (
      filters.statusInconsistencia &&
      venda.statusInconsistencia !== filters.statusInconsistencia
    ) {
      return false;
    }
    if (filters.dataVendaFrom && venda.dataContrato < filters.dataVendaFrom) {
      return false;
    }
    if (dataVendaToBound && venda.dataContrato > dataVendaToBound) {
      return false;
    }
    return true;
  });
}"""

if old_apply not in text:
    raise SystemExit("applyVendasListFiltersInMemory block not found")
text = text.replace(old_apply, new_apply, 1)

repo.write_text(text, encoding="utf-8")
print("repository updated")
