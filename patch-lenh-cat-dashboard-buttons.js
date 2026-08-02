const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// 1. We need to import the Modals and the store hooks in page.tsx
// Add useLenhCat and import toast if not there (it's there).
code = code.replace(
  /const \{ dsLenhCat, xoaLenhCat, capNhatTrangThai, reset \} = useLenhCat\(\);/,
  `const { dsLenhCat, xoaLenhCat, capNhatTrangThai, reset, themMauCongDoan, themMauChiPhi } = useLenhCat();
  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [newMauCD, setNewMauCD] = useState({ id: "", ten: "", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 0 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 0 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 0 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 0 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 0 } } });

  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });`
);

// 2. Add the buttons next to the filter chips
// Current HTML:
// <div className="flex flex-wrap gap-1.5 overflow-x-auto">
//   {(["ALL", "Moi", "DangCat", "DaCat", "HoanThanh"] as const).map((tt) => { ... })}
// </div>

const buttonsToAdd = `
        <div className="w-px h-6 bg-slate-300 mx-2 self-center"></div>
        <button
          onClick={() => setShowTaoMauCD(true)}
          className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200 shadow-sm"
        >
          + Tạo mẫu công đoạn
        </button>
        <button
          onClick={() => setShowTaoMauCP(true)}
          className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 shadow-sm"
        >
          + Tạo bảng chi phí
        </button>
`;

code = code.replace(
  /(\{\(\["ALL", "Moi", "DangCat", "DaCat", "HoanThanh"\] as const\)\.map\(\(tt\) => \{[\s\S]*?\}\)\}\s*<\/div>)/,
  `$1\n${buttonsToAdd}`
);

// 3. Add the Modals to the end of the return
const modalsToAdd = `
      {/* Modal Tạo Mẫu Công Đoạn */}
      {showTaoMauCD && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">Tạo Mẫu Công Đoạn Mới</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Mẫu</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\\s/g, "") }))} />
              </div>
              {["cat", "mayAo", "mayQuan", "inTheu", "uiQC"].map((k) => {
                const labels: any = { cat: "Cắt", mayAo: "May Áo", mayQuan: "May Quần", inTheu: "In/Thêu", uiQC: "Ủi/Đóng Gói" };
                return (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{labels[k]}</span>
                    <input type="number" className="w-32 px-3 py-1 border rounded" placeholder="Đơn giá" value={(newMauCD.giaCong as any)[k].donGia || ""} onChange={e => setNewMauCD(prev => ({ ...prev, giaCong: { ...prev.giaCong, [k]: { ...(prev.giaCong as any)[k], donGia: parseInt(e.target.value) || 0 } } }))} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTaoMauCD(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
              <button onClick={() => { themMauCongDoan(newMauCD); setShowTaoMauCD(false); toast.success("Đã lưu mẫu công đoạn"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Mẫu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Mẫu Chi Phí */}
      {showTaoMauCP && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">Tạo Mẫu Chi Phí Cố Định Mới</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Bảng Giá</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\\s/g, "") }))} />
              </div>
              {["baoBi", "temNhan", "khauHao"].map((k) => {
                const labels: any = { baoBi: "Bao Bì, Túi PE", temNhan: "Tem, Nhãn mác", khauHao: "Khấu hao máy, Điện nước" };
                return (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{labels[k]}</span>
                    <input type="number" className="w-32 px-3 py-1 border rounded" placeholder="Chi phí" value={(newMauCP.chiPhi as any)[k] || ""} onChange={e => setNewMauCP(prev => ({ ...prev, chiPhi: { ...prev.chiPhi, [k]: parseInt(e.target.value) || 0 } }))} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTaoMauCP(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
              <button onClick={() => { themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Bảng Giá</button>
            </div>
          </div>
        </div>
      )}
`;

// Insert the modals right before the closing `</div>` of the main component return
code = code.replace(
  /(\s*\{\/\* Modal \*\/\})/,
  `${modalsToAdd}\n$1`
);

fs.writeFileSync(pageFile, code);
console.log("Patched page.tsx successfully.");
