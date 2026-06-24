import { THEME_STORAGE_KEY } from "@/lib/theme/constants";

/** Script inline executado antes da hidratação para evitar flash de tema incorreto. */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved =
      stored === "light" ? "light" : stored === "dark" ? "dark" : prefersDark ? "dark" : "light";
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
