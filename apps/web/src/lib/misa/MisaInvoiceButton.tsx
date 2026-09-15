import React, { useState } from "react";
import { defaultMisaClient } from "./misa-api";
import type { MisaInvoiceData } from "./misa-types";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

interface MisaInvoiceButtonProps {
  invoiceData: MisaInvoiceData;
  buttonText?: string;
  className?: string;
  onSuccess?: (invoiceId: string) => void;
}

export function MisaInvoiceButton({
  invoiceData,
  buttonText = "Xuất Hóa Đơn MISA",
  className = "",
  onSuccess
}: MisaInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      // MOCK: Gọi API tạo hóa đơn nháp
      const res = await defaultMisaClient.createDraftInvoice(invoiceData);
      
      if (res.success && res.invoiceId) {
        setInvoiceId(res.invoiceId);
        toast.success(`Đã tạo hóa đơn nháp thành công! (Mã: ${res.invoiceId})`);
        if (onSuccess) onSuccess(res.invoiceId);
      } else {
        toast.error("Lỗi khi tạo hóa đơn: " + (res.error || "Không xác định"));
      }
    } catch (error: any) {
      toast.error("Lỗi kết nối MISA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const url = await defaultMisaClient.downloadInvoicePdf(invoiceId);
      toast.info(`Tải PDF tại: ${url}`);
      // Trong thực tế sẽ open URL hoặc dùng a tag download
      // window.open(url, "_blank");
    } catch (error: any) {
      toast.error("Lỗi tải PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (invoiceId) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
          Đã xuất (Nháp)
        </span>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Tải PDF
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreateInvoice}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-[#2B4C3E] text-white rounded-xl font-bold hover:bg-[#1f372c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <FileText className="w-5 h-5" />
      )}
      {buttonText}
    </button>
  );
}
