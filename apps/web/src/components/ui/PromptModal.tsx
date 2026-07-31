"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type PromptModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  inputType?: "text" | "number";
  required?: boolean;
  loading?: boolean;
};

/**
 * Modal nhập liệu nhanh - thay thế window.prompt()
 * Dùng design system: glassmorphism, btn-primary, input class
 */
export function PromptModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  placeholder,
  defaultValue = "",
  submitLabel = "OK",
  cancelLabel = "Huỷ",
  inputType = "text",
  required = true,
  loading = false,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        className="relative card max-w-md w-full p-6 animate-slide-up"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 id="prompt-title" className="text-base font-bold">
            {title}
          </h3>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            aria-label="Đóng"
            className="p-1 rounded hover:bg-white/30 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {description && (
          <p className="text-sm opacity-70 mb-3 whitespace-pre-line">
            {description}
          </p>
        )}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={loading}
          className="input w-full mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading || (required && !value.trim())}
            className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
