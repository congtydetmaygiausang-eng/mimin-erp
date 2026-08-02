const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Remove the static MAU_CONG_DOAN and MAU_CHI_PHI
code = code.replace(/const MAU_CONG_DOAN = \{[\s\S]*?\};\s*const MAU_CHI_PHI = \{[\s\S]*?\};/, '');

// 2. Fetch from store in component
// Currently it has:
// const { dsLenhCat, themLenhCat, suaLenhCat } = useLenhCat();
code = code.replace(
  /const \{ dsLenhCat, themLenhCat, suaLenhCat \} = useLenhCat\(\);/,
  `const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, dsMauChiPhi, themMauCongDoan, themMauChiPhi } = useLenhCat();`
);

// 3. Update the state initializations
code = code.replace(
  /const \[phanCong, setPhanCong\] = useState<PhanCongGiaCong>\(MAU_CONG_DOAN\["BoTheThao"\]\);/,
  `const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(dsMauCongDoan.find(x => x.id === "BoTheThao")?.giaCong || {});`
);
code = code.replace(
  /const \[chiPhiCoDinh, setChiPhiCoDinh\] = useState<ChiPhiCoDinh>\(MAU_CHI_PHI\["BoTheThao"\]\);/,
  `const [chiPhiCoDinh, setChiPhiCoDinh] = useState<ChiPhiCoDinh>(dsMauChiPhi.find(x => x.id === "BoTheThao")?.chiPhi || { baoBi: 0, temNhan: 0, khauHao: 0 });`
);

// 4. Update the select onChange handlers for templates in KHỐI 3 & KHỐI 4
// KHỐI 3 Select:
/*
                <select className="px-2 py-1 text-sm bg-white border border-slate-300 rounded font-bold" value={mauCongDoan} onChange={e => {
                  setMauCongDoan(e.target.value);
                  setPhanCong(MAU_CONG_DOAN[e.target.value as keyof typeof MAU_CONG_DOAN]);
                }}>
*/
// Because there might be multiple matches or it might be slightly different, let's use Regex.
code = code.replace(
  /setPhanCong\(MAU_CONG_DOAN\[e\.target\.value as keyof typeof MAU_CONG_DOAN\]\);/g,
  `const m = dsMauCongDoan.find(x => x.id === e.target.value); if (m) setPhanCong(m.giaCong);`
);
code = code.replace(
  /setChiPhiCoDinh\(MAU_CHI_PHI\[e\.target\.value as keyof typeof MAU_CHI_PHI\]\);/g,
  `const m = dsMauChiPhi.find(x => x.id === e.target.value); if (m) setChiPhiCoDinh(m.chiPhi);`
);

// 5. Replace options mapping
code = code.replace(
  /\{Object\.keys\(MAU_CONG_DOAN\)\.map\(k => <option key=\{k\} value=\{k\}>Mẫu: \{k\}<\/option>\)\}/,
  `{dsMauCongDoan.map(k => <option key={k.id} value={k.id}>Mẫu: {k.ten}</option>)}`
);
code = code.replace(
  /\{Object\.keys\(MAU_CHI_PHI\)\.map\(k => <option key=\{k\} value=\{k\}>Bảng giá: \{k\}<\/option>\)\}/,
  `{dsMauChiPhi.map(k => <option key={k.id} value={k.id}>Bảng giá: {k.ten}</option>)}`
);

// 6. Add Buttons for "+ Tạo mẫu" next to the dropdowns
// For KHỐI 3:
const block3HeaderRegex = /(<h3 className="font-bold text-[#2B4C3E] uppercase flex items-center gap-2">[\s\S]*?<\/h3>\s*<div className="flex gap-2">)/;
code = code.replace(block3HeaderRegex, `$1
                  <button type="button" onClick={() => setShowTaoMauCD(true)} className="px-2 py-1 text-sm bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap">+ Tạo mẫu</button>
`);

// For KHỐI 4:
const block4HeaderRegex = /(<h3 className="font-bold text-[#2B4C3E] uppercase flex items-center gap-2">[\s\S]*?<\/h3>\s*<div className="flex gap-2">)/;
code = code.replace(block4HeaderRegex, `$1
                  <button type="button" onClick={() => setShowTaoMauCP(true)} className="px-2 py-1 text-sm bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap">+ Tạo mẫu</button>
`);

// 7. Add State and Modals
// Inside component, add:
const stateToAdd = `
  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [newMauCD, setNewMauCD] = useState({ id: "", ten: "", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 0 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 0 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 0 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 0 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 0 } } });

  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });
`;
code = code.replace(/const \[mauCongDoan, setMauCongDoan\] = useState/, `${stateToAdd}\n  const [mauCongDoan, setMauCongDoan] = useState`);

// And the UI for modals (inject before `if (!open) return null;` or at the end of return)
const modalsToAdd = `
  {/* Modal Tạo Mẫu Công Đoạn */}
  {showTaoMauCD && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
          <button onClick={() => setShowTaoMauCD(false)} className="px-4 py-2 border rounded text-slate-600">Huỷ</button>
          <button onClick={() => { themMauCongDoan(newMauCD); setShowTaoMauCD(false); setMauCongDoan(newMauCD.id); setPhanCong(newMauCD.giaCong); toast.success("Đã lưu mẫu công đoạn"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold">Lưu Mẫu</button>
        </div>
      </div>
    </div>
  )}

  {/* Modal Tạo Mẫu Chi Phí */}
  {showTaoMauCP && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
          <button onClick={() => setShowTaoMauCP(false)} className="px-4 py-2 border rounded text-slate-600">Huỷ</button>
          <button onClick={() => { themMauChiPhi(newMauCP); setShowTaoMauCP(false); setMauChiPhi(newMauCP.id); setChiPhiCoDinh(newMauCP.chiPhi); toast.success("Đã lưu mẫu chi phí"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold">Lưu Bảng Giá</button>
        </div>
      </div>
    </div>
  )}
`;

code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);/g, `
${modalsToAdd}
      </div>
    </div>
  </div>
  );
`); // Warning: this regex might fail if the end of the file is slightly different.

// Let's use a safer insert location for Modals. Right before the final `</div>` of the overlay.
code = code.replace(/(\s*<\/div>\s*<\/div>\s*<\/div>\s*\);)/, `\n${modalsToAdd}\n$1`);


fs.writeFileSync(modalFile, code);
console.log("Patched LenhCatModal.tsx successfully.");
