// ============ 2 MODAL: MAU CONG DOAN + MAU CHI PHI ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_GIA_CONG = [
  { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
];

// ============ MODAL MAU CONG DOAN ============
export function MauCDModal({ dsMauCongDoan, newMauCD, setNewMauCD, customStepName, setCustomStepName, onClose, onSave }: {
  dsMauCongDoan: any[];
  newMauCD: any;
  setNewMauCD: (v: any) => void;
  customStepName: string;
  setCustomStepName: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="text-lg font-bold mb-4">{dsMauCongDoan.some((x: any) => x.id === newMauCD.id && newMauCD.id !== "") ? "Cập Nhật Mẫu Công Đoạn" : "Tạo Mẫu Công Đoạn Mới"}</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">Tên Mẫu</label>
            <input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD({ ...newMauCD, ten: e.target.value })} />
          </div>
          {newMauCD.giaCong.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong.splice(index, 1);
                  setNewMauCD({ ...newMauCD, giaCong: newGiaCong });
                }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
                <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={item.tenCongDoan} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index].tenCongDoan = e.target.value;
                  setNewMauCD({ ...newMauCD, giaCong: newGiaCong });
                }} />
              </div>
              <div className="flex items-center gap-1 w-32 border rounded px-2">
                <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Đơn giá" value={item.donGia || ""} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index].donGia = parseInt(e.target.value) || 0;
                  setNewMauCD({ ...newMauCD, giaCong: newGiaCong });
                }} />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
            <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên công đoạn mới..." value={customStepName} onChange={e => setCustomStepName(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && customStepName.trim()) {
                const newId = "cd_" + Date.now();
                setNewMauCD({ ...newMauCD, giaCong: [...newMauCD.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] });
                setCustomStepName("");
              }
            }}/>
            <button onClick={() => {
              if (customStepName.trim()) {
                const newId = "cd_" + Date.now();
                setNewMauCD({ ...newMauCD, giaCong: [...newMauCD.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] });
                setCustomStepName("");
              }
            }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
          <button onClick={() => {
            if (!newMauCD.ten.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; }
            onSave();
            toast.success("Đã lưu mẫu công đoạn");
          }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Mẫu</button>
        </div>
      </div>
    </div>
  );
}

// ============ MODAL MAU CHI PHI ============
export function MauCPModal({ dsMauChiPhi, newMauCP, setNewMauCP, customCostName, setCustomCostName, onClose, onSave }: {
  dsMauChiPhi: any[];
  newMauCP: any;
  setNewMauCP: (v: any) => void;
  customCostName: string;
  setCustomCostName: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="text-lg font-bold mb-4">{dsMauChiPhi.some((x: any) => x.id === newMauCP.id && newMauCP.id !== "") ? "Cập Nhật Mẫu Chi Phí Cố Định" : "Tạo Mẫu Chi Phí Cố Định Mới"}</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">Tên Bảng Giá</label>
            <input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP({ ...newMauCP, ten: e.target.value })} />
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {Object.entries(newMauCP.chiPhi || {}).map(([key, val]: [string, any], index: number) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={() => {
                    setNewMauCP((prev: any) => {
                      const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                      delete newChiPhi[key];
                      return { ...prev, chiPhi: newChiPhi };
                    });
                  }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={key} onChange={e => {
                    const newKey = e.target.value;
                    if (newKey && newKey !== key) {
                      setNewMauCP((prev: any) => {
                        const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                        const currentVal = newChiPhi[key];
                        delete newChiPhi[key];
                        newChiPhi[newKey] = currentVal;
                        return { ...prev, chiPhi: newChiPhi };
                      });
                    }
                  }} />
                </div>
                <div className="flex items-center gap-1 w-32 border rounded px-2">
                  <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Chi phí" value={val || ""} onChange={e => {
                    const newVal = parseInt(e.target.value) || 0;
                    setNewMauCP((prev: any) => ({ ...prev, chiPhi: { ...prev.chiPhi, [key]: newVal } }));
                  }} />
                  <span className="text-xs text-slate-400">đ</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
            <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên chi phí mới..." value={customCostName} onChange={e => setCustomCostName(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && customCostName.trim()) {
                setNewMauCP((prev: any) => ({ ...prev, chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 } }));
                setCustomCostName("");
              }
            }}/>
            <button onClick={() => {
              if (customCostName.trim()) {
                setNewMauCP((prev: any) => ({ ...prev, chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 } }));
                setCustomCostName("");
              }
            }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
          <button onClick={() => {
            if (!newMauCP.ten.trim()) { toast.error("Vui lòng nhập tên bảng giá"); return; }
            onSave();
            toast.success("Đã lưu bảng giá");
          }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Bảng Giá</button>
        </div>
      </div>
    </div>
  );
}
