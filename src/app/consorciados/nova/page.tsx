import { redirect } from "next/navigation";

/** Cadastro de consorciado ocorre apenas no fluxo de Nova venda. */
export default function NovaConsorciadoPage() {
  redirect("/vendas/nova");
}
