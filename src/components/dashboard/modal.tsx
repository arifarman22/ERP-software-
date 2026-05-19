"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ModalConfig = {
  title: string;
  description?: string;
  content: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

type ModalContextType = {
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const openModal = useCallback((cfg: ModalConfig) => {
    setConfig(cfg);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 200);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
        {config && (
          <DialogContent className={sizeClasses[config.size ?? "md"]}>
            <DialogHeader>
              <DialogTitle>{config.title}</DialogTitle>
              {config.description && <DialogDescription>{config.description}</DialogDescription>}
            </DialogHeader>
            {config.content}
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
