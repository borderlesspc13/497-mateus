import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
          Carregando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
