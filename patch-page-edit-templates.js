const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// 1. Define handleCreateCD and handleCreateCP helper functions
const oldTriggers = `  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [newMauCD, setNewMauCD] = useState<{id: string; ten: string; giaCong: {id: string; tenCongDoan: string; nguoiMa: string; nguoiTen: string; donGia: number}[]}>({ id: "", ten: "", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
  ] });

  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });`;

const newTriggers = `  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [newMauCD, setNewMauCD] = useState<{id: string; ten: string; giaCong: {id: string; tenCongDoan: string; nguoiMa: string; nguoiTen: string; donGia: number}[]}>({ id: "", ten: "", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
  ] });

  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });

  const handleCreateCD = () => {
    setNewMauCD({ id: "", ten: "", giaCong: [
      { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
    ] });
    setShowTaoMauCD(true);
  };

  const handleCreateCP = () => {
    setNewMauCP({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });
    setShowTaoMauCP(true);
  };`;

code = code.replace(oldTriggers, newTriggers);

// 2. Change onClick handlers for "+ Tạo mẫu công đoạn" and "+ Tạo bảng chi phí"
code = code.replace(`onClick={() => setShowTaoMauCD(true)}`, `onClick={handleCreateCD}`);
code = code.replace(`onClick={() => setShowTaoMauCP(true)}`, `onClick={handleCreateCP}`);

// 3. Add edit button next to trash button for Mẫu Công Đoạn (MCD)
const oldMCDButtons = `                        <button
                          onClick={() => { if (confirm(\`Xoá mẫu "\${m.ten}"?\`)) { xoaMauCongDoan(m.id); toast.success('Đã xoá mẫu'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;

const newMCDButtons = `                        <button
                          onClick={() => {
                            setNewMauCD(m);
                            setShowTaoMauCD(true);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0"
                          title="Sửa mẫu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(\`Xoá mẫu "\${m.ten}"?\`)) { xoaMauCongDoan(m.id); toast.success('Đã xoá mẫu'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;

code = code.replace(oldMCDButtons, newMCDButtons);

// 4. Add edit button next to trash button for Bảng Chi Phí (MCP)
const oldMCPButtons = `                        <button
                          onClick={() => { if (confirm(\`Xoá bảng giá "\${m.ten}"?\`)) { xoaMauChiPhi(m.id); toast.success('Đã xoá bảng giá'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;

const newMCPButtons = `                        <button
                          onClick={() => {
                            setNewMauCP(m);
                            setShowTaoMauCP(true);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0"
                          title="Sửa bảng giá"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(\`Xoá bảng giá "\${m.ten}"?\`)) { xoaMauChiPhi(m.id); toast.success('Đã xoá bảng giá'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;

code = code.replace(oldMCPButtons, newMCPButtons);

// 5. Update input values onChanges so they don't overwrite IDs if editing
const oldMCDInput = `<input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\\s/g, "") }))} />`;
const newMCDInput = `<input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => {
                  const isEdit = dsMauCongDoan.some(x => x.id === prev.id && prev.id !== "");
                  return { ...prev, ten: e.target.value, id: isEdit ? prev.id : e.target.value.replace(/\\s/g, "") };
                })} />`;

code = code.replace(oldMCDInput, newMCDInput);

const oldMCPInput = `<input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\\s/g, "") }))} />`;
const newMCPInput = `<input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => {
                  const isEdit = dsMauChiPhi.some(x => x.id === prev.id && prev.id !== "");
                  return { ...prev, ten: e.target.value, id: isEdit ? prev.id : e.target.value.replace(/\\s/g, "") };
                })} />`;

code = code.replace(oldMCPInput, newMCPInput);

// Update Header Titles of Modals to show "Cập Nhật" if editing
const oldHeaderCD = `<h3 className="text-lg font-bold mb-4">Tạo Mẫu Công Đoạn Mới</h3>`;
const newHeaderCD = `<h3 className="text-lg font-bold mb-4">{dsMauCongDoan.some(x => x.id === newMauCD.id && newMauCD.id !== "") ? "Cập Nhật Mẫu Công Đoạn" : "Tạo Mẫu Công Đoạn Mới"}</h3>`;
code = code.replace(oldHeaderCD, newHeaderCD);

const oldHeaderCP = `<h3 className="text-lg font-bold mb-4">Tạo Mẫu Chi Phí Cố Định Mới</h3>`;
const newHeaderCP = `<h3 className="text-lg font-bold mb-4">{dsMauChiPhi.some(x => x.id === newMauCP.id && newMauCP.id !== "") ? "Cập Nhật Mẫu Chi Phí Cố Định" : "Tạo Mẫu Chi Phí Cố Định Mới"}</h3>`;
code = code.replace(oldHeaderCP, newHeaderCP);

fs.writeFileSync(pageFile, code);
console.log("Patched page.tsx successfully.");
