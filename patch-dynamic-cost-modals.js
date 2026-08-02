const fs = require('fs');

// 1. Modify apps/web/src/components/LenhCatModal.tsx
const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let modalCode = fs.readFileSync(modalFile, 'utf8');

// Replace chiPhiCoDinh state initialization
modalCode = modalCode.replace(
  `const [chiPhiCoDinh, setChiPhiCoDinh] = useState<ChiPhiCoDinh>(dsMauChiPhi.find(x => x.id === "BoTheThao")?.chiPhi || { baoBi: 0, temNhan: 0, khauHao: 0 });`,
  `const [chiPhiCoDinh, setChiPhiCoDinh] = useState<ChiPhiCoDinh>(dsMauChiPhi.find(x => x.id === "BoTheThao")?.chiPhi || {});`
);

// Replace sync useEffect
const oldSyncCP = `  useEffect(() => {
    if (dsMauChiPhi.length > 0 && chiPhiCoDinh.baoBi === 0 && chiPhiCoDinh.temNhan === 0 && chiPhiCoDinh.khauHao === 0) {
      const defaultCP = dsMauChiPhi.find(x => x.id === "BoTheThao") || dsMauChiPhi[0];
      if (defaultCP) {
        setMauChiPhi(defaultCP.id);
        setChiPhiCoDinh(defaultCP.chiPhi);
      }
    }
  }, [dsMauChiPhi, chiPhiCoDinh]);`;

const newSyncCP = `  useEffect(() => {
    if (dsMauChiPhi.length > 0 && Object.keys(chiPhiCoDinh).length === 0) {
      const defaultCP = dsMauChiPhi.find(x => x.id === "BoTheThao") || dsMauChiPhi[0];
      if (defaultCP) {
        setMauChiPhi(defaultCP.id);
        setChiPhiCoDinh(defaultCP.chiPhi);
      }
    }
  }, [dsMauChiPhi, chiPhiCoDinh]);`;

modalCode = modalCode.replace(oldSyncCP, newSyncCP);

// Replace tongChiPhiCoDinh calculation
modalCode = modalCode.replace(
  `const tongChiPhiCoDinh = chiPhiCoDinh.baoBi + chiPhiCoDinh.temNhan + chiPhiCoDinh.khauHao;`,
  `const tongChiPhiCoDinh = Object.values(chiPhiCoDinh).reduce((a, b) => a + b, 0);`
);

// Replace the rendered inputs under CHI PHÍ CỐ ĐỊNH / SẢN PHẨM section
const oldCostInputs = `                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Bao bì, Túi PE</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.baoBi} onChange={e => setChiPhiCoDinh(p => ({...p, baoBi: parseInt(e.target.value)||0}))} />
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Tem, Nhãn mác</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.temNhan} onChange={e => setChiPhiCoDinh(p => ({...p, temNhan: parseInt(e.target.value)||0}))} />
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Khấu hao máy, Điện nước</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.khauHao} onChange={e => setChiPhiCoDinh(p => ({...p, khauHao: parseInt(e.target.value)||0}))} />
                    </div>
                  </div>`;

const newCostInputs = `                  <div className="space-y-3">
                    {Object.entries(chiPhiCoDinh).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                        <span className="text-sm font-semibold text-slate-700">{key}</span>
                        <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={val} onChange={e => setChiPhiCoDinh(p => ({...p, [key]: parseInt(e.target.value)||0}))} />
                      </div>
                    ))}
                  </div>`;

modalCode = modalCode.replace(oldCostInputs, newCostInputs);

fs.writeFileSync(modalFile, modalCode);
console.log("Patched LenhCatModal.tsx successfully.");

// 2. Modify apps/web/src/app/(main)/lenh-cat/page.tsx
const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let pageCode = fs.readFileSync(pageFile, 'utf8');

// Add customCostName state in LenhCatPage component after customStepName state
pageCode = pageCode.replace(
  `  const [customStepName, setCustomStepName] = useState("");`,
  `  const [customStepName, setCustomStepName] = useState("");\n  const [customCostName, setCustomCostName] = useState("");`
);

// Replace dsMauChiPhi expanded view in main page list
const oldMauCPExpandedView = `                      {expandedMauCP === m.id && (
                        <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                          <div className="flex justify-between text-xs"><span className="text-slate-600">Bao Bì, Túi PE</span><span className="font-bold text-emerald-700">{m.chiPhi.baoBi.toLocaleString()}đ</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-600">Tem, Nhãn mác</span><span className="font-bold text-emerald-700">{m.chiPhi.temNhan.toLocaleString()}đ</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-600">Khấu hao, Điện nước</span><span className="font-bold text-emerald-700">{m.chiPhi.khauHao.toLocaleString()}đ</span></div>
                          <div className="flex justify-between text-xs pt-1 border-t border-emerald-100 mt-1">
                            <span className="font-bold text-slate-700">Tổng chi phí cố định/SP</span>
                            <span className="font-bold text-emerald-600">{(m.chiPhi.baoBi + m.chiPhi.temNhan + m.chiPhi.khauHao).toLocaleString()}đ</span>
                          </div>
                        </div>
                      )}`;

const newMauCPExpandedView = `                      {expandedMauCP === m.id && (
                        <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                          {Object.entries(m.chiPhi || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-slate-600">{key}</span>
                              <span className="font-bold text-emerald-700">{val.toLocaleString()}đ</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-1 border-t border-emerald-100 mt-1">
                            <span className="font-bold text-slate-700">Tổng chi phí cố định/SP</span>
                            <span className="font-bold text-emerald-600">{Object.values(m.chiPhi || {}).reduce((s, v) => s + v, 0).toLocaleString()}đ</span>
                          </div>
                        </div>
                      )}`;

pageCode = pageCode.replace(oldMauCPExpandedView, newMauCPExpandedView);

// Replace Bảng Chi Phí Cố Định length cost sum calculation in list heading
pageCode = pageCode.replace(
  `({(m.chiPhi.baoBi + m.chiPhi.temNhan + m.chiPhi.khauHao).toLocaleString()}đ/sp)`,
  `({Object.values(m.chiPhi || {}).reduce((s, v) => s + v, 0).toLocaleString()}đ/sp)`
);

// Replace "Modal Tạo Mẫu Chi Phí" with the new layout that allows adding, editing, and deleting cost items
const oldModalCPBody = `      {/* Modal Tạo Mẫu Chi Phí */}
      {showTaoMauCP && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">{dsMauChiPhi.some(x => x.id === newMauCP.id && newMauCP.id !== "") ? "Cập Nhật Mẫu Chi Phí Cố Định" : "Tạo Mẫu Chi Phí Cố Định Mới"}</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Bảng Giá</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value }))} />
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
              <button onClick={() => { if (!newMauCP.ten.trim()) { toast.error("Vui lòng nhập tên bảng giá"); return; } themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Bảng Giá</button>
            </div>
          </div>
        </div>
      )}`;

const newModalCPBody = `      {/* Modal Tạo Mẫu Chi Phí */}
      {showTaoMauCP && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">{dsMauChiPhi.some(x => x.id === newMauCP.id && newMauCP.id !== "") ? "Cập Nhật Mẫu Chi Phí Cố Định" : "Tạo Mẫu Chi Phí Cố Định Mới"}</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Bảng Giá</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value }))} />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                {Object.entries(newMauCP.chiPhi || {}).map(([key, val], index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => {
                        setNewMauCP(prev => {
                          const newChiPhi = { ...prev.chiPhi };
                          delete newChiPhi[key];
                          return { ...prev, chiPhi: newChiPhi };
                        });
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={key} onChange={e => {
                        const newKey = e.target.value;
                        if (newKey && newKey !== key) {
                          setNewMauCP(prev => {
                            const newChiPhi = { ...prev.chiPhi };
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
                        setNewMauCP(prev => ({
                          ...prev,
                          chiPhi: { ...prev.chiPhi, [key]: newVal }
                        }));
                      }} />
                      <span className="text-xs text-slate-400">đ</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Thêm chi phí mới */}
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên chi phí mới..." value={customCostName} onChange={e => setCustomCostName(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" && customCostName.trim()) {
                    setNewMauCP(prev => ({
                      ...prev,
                      chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 }
                    }));
                    setCustomCostName("");
                  }
                }}/>
                <button onClick={() => {
                  if (customCostName.trim()) {
                    setNewMauCP(prev => ({
                      ...prev,
                      chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 }
                    }));
                    setCustomCostName("");
                  }
                }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTaoMauCP(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
              <button onClick={() => { if (!newMauCP.ten.trim()) { toast.error("Vui lòng nhập tên bảng giá"); return; } themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Bảng Giá</button>
            </div>
          </div>
        </div>
      )}`;

pageCode = pageCode.replace(oldModalCPBody, newModalCPBody);

fs.writeFileSync(pageFile, pageCode);
console.log("Patched page.tsx successfully.");
