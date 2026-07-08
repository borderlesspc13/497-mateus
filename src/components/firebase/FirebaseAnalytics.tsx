"use client";

import { useEffect } from "react";

/** Inicializa Firebase Analytics no cliente quando suportado. */
export function FirebaseAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    void import("@/lib/firebase/client").then(({ getFirebaseAnalytics }) =>
      getFirebaseAnalytics(),
    );
  }, []);
  return null;
}
