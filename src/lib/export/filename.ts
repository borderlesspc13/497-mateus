/** Gera nome de arquivo no padrão `base_YYYY-MM-DD.xlsx` usando data local. */
export function buildExportFileName(base: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const sanitizedBase = base.replace(/[^\w-]+/g, "_").replace(/_+/g, "_");
  return `${sanitizedBase}_${year}-${month}-${day}.xlsx`;
}
