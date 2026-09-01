"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Drawer } from "vaul";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string; // Custom modal background/text classes
  overlayClassName?: string;
}

export function ResponsiveModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "lg",
  className = "bg-white dark:bg-[#1C2128]",
  overlayClassName = "bg-black/40 backdrop-blur-sm",
}: ResponsiveModalProps) {
  const [isDesktop, setIsDesktop] = useState(true); // Default to desktop to prevent SSR hydration mismatch

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  if (isDesktop) {
    if (!open) return null;
    const maxWidthClass = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      "5xl": "max-w-5xl",
      full: "max-w-full m-4",
    }[maxWidth];

    const modalContent = (
      <div className={`print-modal-root fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in print:p-0 print:items-start print:justify-start print:relative print:inset-auto print:block print:m-0`}>
        <div className={`absolute inset-0 ${overlayClassName} print:hidden`} onClick={onClose} />
        <div className={`relative ${className} rounded-xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col animate-slide-up border border-slate-200 dark:border-white/10 print:max-w-none print:w-full print:max-h-none print:border-none print:shadow-none print:rounded-none print:block print:p-0`}>
          {title && (
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 shrink-0 print:hidden">
              <h2 className="text-lg font-semibold text-inherit">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-inherit opacity-70 hover:opacity-100 transition-colors" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 print:overflow-visible print:h-auto">
            {children}
          </div>
        </div>
      </div>
    );

    if (typeof document !== "undefined") {
      return createPortal(modalContent, document.body);
    }
    return modalContent;
  }

  // Mobile Bottom Sheet using Vaul
  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className={`fixed inset-0 ${overlayClassName} z-[100]`} />
        <Drawer.Content className={`${className} flex flex-col rounded-t-[20px] max-h-[96vh] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none`}>
          <div className="p-4 rounded-t-[20px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-white/20 mb-4 opacity-50" />
            {title && (
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-white/10">
                <Drawer.Title className="font-semibold text-lg text-inherit">
                  {title}
                </Drawer.Title>
                <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-full text-inherit opacity-70">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
