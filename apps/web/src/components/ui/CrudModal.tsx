"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type FieldDef =
  | { name: string; label: string; type: "text"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "email"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "number"; required?: boolean; placeholder?: string; min?: number; max?: number }
  | { name: string; label: string; type: "date"; required?: boolean }
  | { name: string; label: string; type: "textarea"; required?: boolean; placeholder?: string; rows?: number }
  | { name: string; label: string; type: "select"; required?: boolean; options: { value: string; label: string }[] };

export function CrudModal({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  initial,
  submitLabel = "Lưu",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldDef[];
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  initial?: Record<string, string>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setValues(initial || {});
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`Vui lòng nhập ${f.label.toLowerCase()}`);
        return;
      }
      if (f.type === "email" && values[f.name]) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values[f.name])) {
          toast.error(`${f.label} không đúng định dạng`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      await onSubmit(values);
      toast.success("Đã lưu thành công");
      onClose();
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/5" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  className="input"
                  rows={f.rows || 3}
                  placeholder={f.placeholder}
                  value={values[f.name] || ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              ) : f.type === "select" ? (
                <select
                  className="input"
                  value={values[f.name] || ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={f.type}
                  placeholder={"placeholder" in f ? f.placeholder : undefined}
                  required={f.required}
                  min={f.type === "number" ? f.min : undefined}
                  max={f.type === "number" ? f.max : undefined}
                  value={values[f.name] || ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
