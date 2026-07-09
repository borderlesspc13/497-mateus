"use client";

import { useServerInsertedHTML } from "next/navigation";
import { getThemeInitScript } from "@/lib/theme/constants";

/** Injeta o script de tema no HTML do SSR, fora da árvore hidratada pelo React. */
export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
  ));

  return null;
}
