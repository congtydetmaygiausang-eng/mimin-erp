const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// Replace newMauCD name onChange to only update name, keeping ID stable (generated on create or edit)
const oldMCDChange = `onChange={e => setNewMauCD(prev => {
                  const isEdit = dsMauCongDoan.some(x => x.id === prev.id && prev.id !== "");
                  return { ...prev, ten: e.target.value, id: isEdit ? prev.id : e.target.value.replace(/\\s/g, "") };
                })}`;

const newMCDChange = `onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value }))}`;

code = code.replace(oldMCDChange, newMCDChange);

// Replace newMauCP name onChange similarly
const oldMCPChange = `onChange={e => setNewMauCP(prev => {
                  const isEdit = dsMauChiPhi.some(x => x.id === prev.id && prev.id !== "");
                  return { ...prev, ten: e.target.value, id: isEdit ? prev.id : e.target.value.replace(/\\s/g, "") };
                })}`;

const newMCPChange = `onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value }))}`;

code = code.replace(oldMCPChange, newMCPChange);

// Update handleCreateCD to generate a unique ID on creation
const oldCreateCD = `  const handleCreateCD = () => {
    setNewMauCD({ id: "", ten: "", giaCong: [`;

const newCreateCD = `  const handleCreateCD = () => {
    setNewMauCD({ id: "cd_" + Date.now(), ten: "", giaCong: [`;

code = code.replace(oldCreateCD, newCreateCD);

// Update handleCreateCP to generate a unique ID on creation
const oldCreateCP = `  const handleCreateCP = () => {
    setNewMauCP({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });`;

const newCreateCP = `  const handleCreateCP = () => {
    setNewMauCP({ id: "cp_" + Date.now(), ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });`;

code = code.replace(oldCreateCP, newCreateCP);

// Add simple validation before saving: name cannot be empty
const oldSaveCD = `themMauCongDoan(newMauCD); setShowTaoMauCD(false); toast.success("Đã lưu mẫu công đoạn");`;
const newSaveCD = `if (!newMauCD.ten.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; } themMauCongDoan(newMauCD); setShowTaoMauCD(false); toast.success("Đã lưu mẫu công đoạn");`;
code = code.replace(oldSaveCD, newSaveCD);

const oldSaveCP = `themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá");`;
const newSaveCP = `if (!newMauCP.ten.trim()) { toast.error("Vui lòng nhập tên bảng giá"); return; } themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá");`;
code = code.replace(oldSaveCP, newSaveCP);

fs.writeFileSync(pageFile, code);
console.log("Patched page.tsx with robust ID generation and validation.");
