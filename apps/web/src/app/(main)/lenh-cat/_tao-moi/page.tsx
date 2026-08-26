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

  const currentStepData = WIZARD_STEPS[currentStep - 1];
  const CurrentStepIcon = currentStepData?.icon || FileText;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-20">
      {/* Premium Header - Full Width */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => router.push("/lenh-cat")}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent truncate">
                Tạo Lệnh Cắt Mới
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Bước {currentStep}/{WIZARD_STEPS.length}: {currentStepData?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/lenh-cat")} className="hidden sm:flex text-sm">
              Hủy bỏ
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer - Hidden */}

      {/* Main Card Container - Full Screen Responsive */}
      <div className="w-full px-4 lg:px-8 mt-8 mb-12">
        {/* Progress Bar - Full Width */}
        <div className="mb-12">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-600"
            />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2 md:gap-4">
            {WIZARD_STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center cursor-pointer group hidden lg:flex"
                  onClick={() => setCurrentStep(step.id)}
                  whileHover={{ scale: 1.08 }}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                    isActive 
                      ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/50 scale-110" 
                      : isCompleted 
                        ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <p className={`text-xs font-semibold mt-3 text-center leading-tight transition-colors ${
                    isActive 
                      ? "text-violet-700 dark:text-violet-400" 
                      : isCompleted
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {step.title}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Main Card - Full Width Responsive */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-slate-300/20 dark:shadow-none overflow-hidden"
          >
            {/* Card Header - Full Width */}
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-violet-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 px-6 lg:px-12 py-8 border-b border-slate-200/50 dark:border-slate-600/50">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/30">
                  <CurrentStepIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    {currentStepData?.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    {currentStepData?.description}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-violet-100/50 dark:bg-violet-900/20 rounded-xl border border-violet-200/50 dark:border-violet-800/50">
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                    {currentStep} / {WIZARD_STEPS.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Content - Full Width Scrollable */}
            <div className="px-6 lg:px-12 py-10 md:py-12 min-h-[500px] overflow-y-auto max-h-[calc(100vh-400px)]">
              {currentStep === 1 && <Step1GeneralInfo />}
              {currentStep === 2 && <Step2Fabric />}
              {currentStep === 3 && <Step3Accessories />}
              {currentStep === 4 && <Step4Subcontractors />}
              {currentStep === 5 && <Step5COGS />}
            </div>

            {/* Card Footer - Full Width */}
            <div className="px-6 lg:px-12 py-6 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-700/30 dark:to-slate-800/30 border-t border-slate-200/50 dark:border-slate-600/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1 || isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Button>

              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Bước {currentStep} / {WIZARD_STEPS.length}
              </div>

              <Button 
                onClick={currentStep === WIZARD_STEPS.length ? handleSubmit : handleNext}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {currentStep === WIZARD_STEPS.length ? (
                  isSubmitting ? "Đang lưu..." : "🚀 Phát Lệnh"
                ) : (
                  <>
                    Tiếp tục <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
