"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function schedule(delay: number, fn: () => void) {
    const timer = window.setTimeout(fn, delay);
    timersRef.current.push(timer);
  }

  function start() {
    clearTimers();
    setVisible(true);
    setProgress(12);
    schedule(80, () => setProgress(38));
    schedule(240, () => setProgress(68));
    schedule(520, () => setProgress(88));
  }

  function finish() {
    clearTimers();
    setProgress(100);
    schedule(180, () => {
      setVisible(false);
      setProgress(0);
    });
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor?.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === pathname) return;

      start();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (visible) finish();
  }, [pathname, visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-zinc-200/80"
      aria-hidden
    >
      <div
        className="h-full bg-zinc-900 transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
