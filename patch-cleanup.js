const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Correct the phuTrachSX options which had getDoiTuongOptions(kh.tenCongDoan) error
code = code.replace(
  'getDoiTuongOptions(kh.tenCongDoan).map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)',
  'REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)'
);

// 2. Remove the corrupted duplicated section inside the IIFE at lines 618-728
// Let's locate the IIFE block precisely.
const badBlockStart = `                    {/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}
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
                              <div className="text-sm font-bold text-emerald-900">{formatVND(tongTienVaiMau)}`;

const targetIife = `                    {/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}
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
                    })()}`;

const badBlockEndIndex = code.indexOf('})()}', code.indexOf('Tổng tiền vải màu này'));
const badBlockStartIndex = code.indexOf('{/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}');

if (badBlockStartIndex !== -1 && badBlockEndIndex !== -1) {
  code = code.substring(0, badBlockStartIndex) + targetIife + code.substring(badBlockEndIndex + 5);
  console.log("Syntax error in LenhCatModal IIFE fixed.");
} else {
  console.log("Could not locate bad IIFE block.");
}

fs.writeFileSync(modalFile, code);
