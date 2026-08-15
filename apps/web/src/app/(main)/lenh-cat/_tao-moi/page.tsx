"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ChevronRight, CheckCircle2, 
  Scissors, Package, Users, Calculator, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Steps definition
const WIZARD_STEPS = [
  { id: 1, title: "Thông tin chung", icon: FileText, description: "Mã SP, Số lượng, Thời gian" },
  { id: 2, title: "Tính Vải & Sơ đồ", icon: Scissors, description: "Định mức & hao hụt vải" },
  { id: 3, title: "Phụ liệu", icon: Package, description: "Bo cổ, cúc, chỉ, tem nhãn" },
  { id: 4, title: "Phân công Gia công", icon: Users, description: "Cắt, May, In, Hoàn thiện" },
  { id: 5, title: "Giá vốn (COGS)", icon: Calculator, description: "Tính giá vốn dự kiến" },
];

import { WizardProvider, useWizard } from "./WizardContext";
import { Step1GeneralInfo } from "./components/Step1_GeneralInfo";
import { Step2Fabric } from "./components/Step2_Fabric";
import { Step3Accessories } from "./components/Step3_Accessories";
import { Step4Subcontractors } from "./components/Step4_Subcontractors";
import { Step5COGS } from "./components/Step5_COGS";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useSession } from "@/components/session-provider";

export default function TaoLenhCatPage() {
  return (
    <WizardProvider>
      <TaoLenhCatContent />
    </WizardProvider>
  );
}

function TaoLenhCatContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useWizard();
  const { themLenhCat } = useLenhCat();
  const { user } = useSession();

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!state.maSP || !state.tongSL) {
        toast.error("Vui lòng điền mã sản phẩm và tổng số lượng!");
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      
      const payload = {
        loaiLenh: state.loaiLenh,
        khachHang: state.khachHang,
        loaiSP: state.loaiSP,
        maSP: state.maSP,
        tenSP: state.tenSP,
        tongSL: Number(state.tongSL) || 0,
        tongSLThucTe: state.tongSLThucTe,
        ngayTao: state.ngayBatDau,
        hanHoanThanh: state.hanHoanThanh,
        phuTrachCat: state.phuTrachCat,
        phuTrachSX: state.phuTrachSX,
        ghiChu: state.ghiChu,
        ghiChuKyThuat: state.ghiChuKyThuat,
        tiLeSize: state.tiLeSize,
        dsMau: state.dsMau,
        dsPhuLieu: state.dsPhuLieu,
        phanCong: state.phanCong,
        chiPhiCoDinh: state.chiPhiCoDinh,
        daCoSoDo: state.daCoSoDo,
        soDoChinh: state.soDoChinh,
        soDoPhoi: state.soDoPhoi,
      };

      await themLenhCat(payload, user as any);
      toast.success("Tạo lệnh cắt thành công!");
      router.push("/lenh-cat");
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi tạo lệnh cắt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900 pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/lenh-cat")}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Tạo Lệnh Cắt Mới
              </h1>
              <p className="text-xs text-slate-500 font-medium">Thiết lập thông số và tính toán giá vốn</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/lenh-cat")}>
              Hủy bỏ
            </Button>
            <Button 
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
              onClick={currentStep === WIZARD_STEPS.length ? handleSubmit : handleNext}
              disabled={isSubmitting}
            >
              {currentStep === WIZARD_STEPS.length ? (
                isSubmitting ? "Đang lưu..." : "Phát Lệnh & Điều Chuyển"
              ) : (
                <>
                  Tiếp tục <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar: Step Indicator */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="sticky top-28 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/10 p-4 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 px-2 uppercase tracking-wider">Tiến trình</h2>
            <div className="space-y-1 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative flex items-start gap-4 p-2 z-10 group cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 scale-110" 
                        : isCompleted 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className={`pt-1 transition-colors duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}>
                      <div className={`text-sm font-semibold ${isActive ? "text-violet-700 dark:text-violet-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content: Step Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/10 shadow-xl shadow-slate-200/20 dark:shadow-none min-h-[500px] p-6 sm:p-8"
            >
              {currentStep === 1 && <Step1GeneralInfo />}
              {currentStep === 2 && <Step2Fabric />}
              {currentStep === 3 && <Step3Accessories />}
              {currentStep === 4 && <Step4Subcontractors />}
              {currentStep === 5 && <Step5COGS />}
            </motion.div>
          </AnimatePresence>

          {/* Bottom Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
            <Button 
              onClick={currentStep === WIZARD_STEPS.length ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
            >
              {currentStep === WIZARD_STEPS.length ? (
                isSubmitting ? "Đang lưu..." : "Hoàn tất"
              ) : (
                <>Tiếp theo <ChevronRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
