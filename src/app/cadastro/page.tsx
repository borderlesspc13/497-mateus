import { redirect } from "next/navigation";
import { countUsuarios } from "@/lib/firestore/usuarios";
import CadastroForm from "./CadastroForm";

export default async function CadastroPage() {
  const total = await countUsuarios();
  if (total > 0) {
    redirect("/login");
  }

  return <CadastroForm />;
}
