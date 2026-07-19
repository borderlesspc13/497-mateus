import { redirect } from "next/navigation";
import { findFirstAccessibleRoute, findFirstControleRoute } from "@/lib/auth/modules";
import { getServerSessionUser } from "@/lib/auth/server";

export default async function ControleIndexPage() {
  const session = await getServerSessionUser();
  const permissions = session?.permissions ?? [];
  const firstControle = findFirstControleRoute(permissions);
  redirect(firstControle ?? findFirstAccessibleRoute(permissions));
}
