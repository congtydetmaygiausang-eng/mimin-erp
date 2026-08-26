"use client";

import React, { createContext, useContext, useState } from "react";
import { type LoaiLenh, type LoaiSP, type TrangThaiLenhCat, type MauVai, type LenhCatPhuLieu, type PhanCongGiaCong, type ChiPhiCoDinh } from "@/lib/data/lenh-cat-store";
import { BANG_CHI_PHI_CO_DINH } from "@/lib/data/lenh-cat-store";
import { type UploadedFile } from "@/components/ui/ImageUploader";

export interface SoDoCat {
  id: string;
  tenSoDo: string; // Sơ đồ áo, sơ đồ quần
  chieuDai: number; // m
  soSpTrenSoDo: number;
  metTrenKg: number; // m/kg (vd: 1.9)
  soLop: number;
  fileUrl?: string; // Để lưu file sơ đồ
}

interface WizardState {
  // Step 1
  loaiLenh: LoaiLenh;
  khachHang: string;
  loaiSP: LoaiSP;
  maSP: string;
  tenSP: string;
  tongSL: number | "";
  tongSLThucTe: number | "";
  ngayBatDau: string;
  hanHoanThanh: string;
  phuTrachCat: string;
  phuTrachSX: string;
  ghiChu: string;
  ghiChuKyThuat: string;
  tiLeSize: string;
    hinhAnh: string;
  hinhAnhFiles: UploadedFile[];

  
  // Step 2
  soMau: number;
  dsMau: MauVai[];
  daCoSoDo: boolean;
  soDoChinh: string;
  khoSoDoChinh: string;
  daiSoDoChinh: string;
  pdfSoDoChinh: string;
  ghiChuSoDoChinh: string;
  soDoPhoi: string;
  khoSoDoPhoi: string;
  daiSoDoPhoi: string;
  pdfSoDoPhoi: string;
  ghiChuSoDoPhoi: string;
  dsSoDo: SoDoCat[];
  
  // Step 3
  dsPhuLieu: LenhCatPhuLieu[];
  
  // Step 4
  mauCongDoan: string;
  phanCong: PhanCongGiaCong[];
  
  // Step 5
  chiPhiCoDinh: ChiPhiCoDinh;
}

interface WizardContextType {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

const defaultState: WizardState = {
  loaiLenh: "HangNha",
  khachHang: "",
  loaiSP: "BoTru",
  maSP: "",
  tenSP: "",
  tongSL: "",
  tongSLThucTe: "",
  ngayBatDau: new Date().toISOString().split("T")[0],
  hanHoanThanh: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  })(),
  phuTrachCat: "NV006",
  phuTrachSX: "",
  ghiChu: "",
  ghiChuKyThuat: "",
  tiLeSize: "1:2:2:1",
    hinhAnh: "",
  hinhAnhFiles: [],

  soMau: 4,
  dsMau: [],
  daCoSoDo: false,
  soDoChinh: "",
  khoSoDoChinh: "",
  daiSoDoChinh: "",
  pdfSoDoChinh: "",
  ghiChuSoDoChinh: "",
  soDoPhoi: "",
  khoSoDoPhoi: "",
  daiSoDoPhoi: "",
  pdfSoDoPhoi: "",
  ghiChuSoDoPhoi: "",
  dsSoDo: [],
  dsPhuLieu: [],
  mauCongDoan: "BoTheThao",
  phanCong: [],
  chiPhiCoDinh: BANG_CHI_PHI_CO_DINH["BoTru"] || {},
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <WizardContext.Provider value={{ state, updateState }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
