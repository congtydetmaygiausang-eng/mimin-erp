const fs = require('fs');

// 1. Update lenh-cat-store.tsx
const storeFile = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let storeCode = fs.readFileSync(storeFile, 'utf8');

// Add maSKU to MauVai
if (!storeCode.includes('maSKU?: string;')) {
  storeCode = storeCode.replace(
    'ten: string;',
    'ten: string;\n  maSKU?: string;'
  );
  fs.writeFileSync(storeFile, storeCode);
}

// 2. Update LenhCatModal.tsx
const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let modalCode = fs.readFileSync(modalFile, 'utf8');

// We need to inject maSKU into the initial state
modalCode = modalCode.replace(
  /ten: "", maVai: "", dinhMuc: 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: \[\]/g,
  'ten: "", maSKU: "", maVai: "", dinhMuc: 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: []'
);

// We need to update the card layout.
// Find the card rendering part:
/*
                  {/* Left: Image *\/}
                  <div className="w-1/3 flex flex-col gap-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Màu {idx + 1}</div>
                    <input 
                      type="text"
                      className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold" 
                      placeholder="Tên màu..."
                      value={mau.ten}
                      onChange={(e) => {
                        const next = [...dsMau]; next[idx].ten = e.target.value; setDsMau(next);
                      }}
                    />
*/
// We need to add the maSKU input next to Tên màu... Wait, in the image, the red box is next to the "Tên màu..." input, above "Kho Vải Chính".
// Actually, looking at the layout, Tên Màu is on the Left. The top right red box is on the Right side, above "Kho Vải Chính".
// The right side currently starts with "Kho Vải Chính". So we can insert the SKU input there.

const cardRightSideRegex = /(<div className="w-2\/3 flex flex-col gap-3 justify-center">)(\s*<div>\s*<label className="text-\[10px\] font-bold text-slate-500 mb-1 block">Kho Vải Chính<\/label>)/;

const newTopRight = `$1
                    <div className="flex gap-2">
                      <div className="w-full">
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Mã SKU Biến Thể</label>
                        <input 
                          type="text"
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold text-emerald-700" 
                          placeholder="VD: SP001-DEN"
                          value={mau.maSKU || ""}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].maSKU = e.target.value; setDsMau(next);
                          }}
                        />
                      </div>
                    </div>$2`;

modalCode = modalCode.replace(cardRightSideRegex, newTopRight);

// Now the bottom red boxes. 
// After the "Tự động bung size theo tỉ lệ" block, add the two red boxes for Tiền vải/SP and Tổng tiền vải.
const sizeRatioBlockRegex = /(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;

// Wait, the structure is:
/*
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                      ... size ratio ...
                    </div>
                  </div>
                </div>
              ))}
*/

// Let's replace specifically after the size ratio block:
const sizeRatioEndRegex = /(<div className="flex flex-wrap gap-2">[\s\S]*?<\/div>\s*<\/div>)/;

const newBottomBoxes = `$1
                    
                    {/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}
                    {(() => {
                      const v = KHO_VAI.find(x => x.maVT === mau.maVai);
                      const donGia = v ? (v.donGia || 0) : 0;
                      const tienVai1SP = mau.dinhMuc * donGia;
                      const tongTienVaiMau = tienVai1SP * (mau.slDuKien || 0);
                      return (
                        <div className="flex gap-2 mt-1">
                          <div className="w-1/2 bg-amber-50 p-2 rounded border border-amber-200">
                             <div className="text-[10px] font-bold text-amber-700">Giá vải / 1 SP</div>
                             <div className="text-sm font-bold text-amber-900">{formatVND(tienVai1SP)}</div>
                          </div>
                          <div className="w-1/2 bg-emerald-50 p-2 rounded border border-emerald-200">
                             <div className="text-[10px] font-bold text-emerald-700">Tổng tiền vải màu này</div>
                             <div className="text-sm font-bold text-emerald-900">{formatVND(tongTienVaiMau)}</div>
                          </div>
                        </div>
                      );
                    })()}
`;

modalCode = modalCode.replace(sizeRatioEndRegex, newBottomBoxes);

// Fix formatVND import if needed. We have formatVNDShort, need formatVND.
// import { KHO_VAI, KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
// We already imported formatVND? Let's check the code.
// The file has: import { KHO_VAI, KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
// But wait, the previous patch script for LenhCatModal replaced the whole component but kept the top imports. 
// Let's make sure formatVND is available. It is used in the COGS section.

fs.writeFileSync(modalFile, modalCode);
console.log("Patched successfully");
