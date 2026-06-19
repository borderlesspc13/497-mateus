"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
  });
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  function close(result: boolean) {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current(result);
  }

  const isDestructive = state.variant === "destructive";

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            {state.description ? (
              <DialogDescription>{state.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => close(false)}>
              {state.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={() => close(true)}
            >
              {state.confirmLabel ?? (isDestructive ? "Excluir" : "Confirmar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog deve ser usado dentro de ConfirmDialogProvider");
  }
  return ctx;
}
