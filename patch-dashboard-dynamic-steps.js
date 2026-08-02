const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// Ensure import for Trash2
if (!code.includes("import { Trash2 }")) {
  code = code.replace(
    /import \{ useState \} from "react";/,
    `import { useState } from "react";\nimport { Trash2, Search, Plus, Filter, MoreHorizontal } from "lucide-react";`
  );
  // Just to be safe if lucide-react is already imported differently
  if (!code.includes('import { Trash2, Search, Plus, Filter, MoreHorizontal } from "lucide-react";')) {
      code = `import { Trash2 } from "lucide-react";\n` + code;
  }
}

// 1. Update the state initialization in page.tsx
const oldStateRegex = /const \[newMauCD, setNewMauCD\] = useState\(\{ id: "", ten: "", giaCong: \{ cat: \{[\s\S]*?\} \}\);/;
const newState = `const [newMauCD, setNewMauCD] = useState<{id: string; ten: string; giaCong: {id: string; tenCongDoan: string; nguoiMa: string; nguoiTen: string; donGia: number}[]}>({ id: "", ten: "", giaCong: [\n    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },\n    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }\n  ] });`;
code = code.replace(oldStateRegex, newState);

// 2. Add state for the new custom step name
code = code.replace(
  /const \[newMauCD, setNewMauCD\] = useState<{/,
  `const [customStepName, setCustomStepName] = useState("");\n  const [newMauCD, setNewMauCD] = useState<{`
);

// 3. Update the Modal content in page.tsx
const oldModalContentRegex = /\{\["cat", "mayAo", "mayQuan", "inTheu", "uiQC"\]\.map\(\(k\) => \{[\s\S]*?\}\)\}/;
const newModalContent = `{newMauCD.giaCong.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong.splice(index, 1);
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={item.tenCongDoan} onChange={e => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong[index].tenCongDoan = e.target.value;
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} />
                    </div>
                    <div className="flex items-center gap-1 w-32 border rounded px-2">
                      <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Đơn giá" value={item.donGia || ""} onChange={e => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong[index].donGia = parseInt(e.target.value) || 0;
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} />
                      <span className="text-xs text-slate-400">đ</span>
                    </div>
                  </div>
                ))}
                
                {/* Thêm công đoạn mới */}
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                  <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên công đoạn mới..." value={customStepName} onChange={e => setCustomStepName(e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter" && customStepName.trim()) {
                      const newId = "cd_" + Date.now();
                      setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                      setCustomStepName("");
                    }
                  }}/>
                  <button onClick={() => {
                    if (customStepName.trim()) {
                      const newId = "cd_" + Date.now();
                      setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                      setCustomStepName("");
                    }
                  }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
                </div>
`;

code = code.replace(oldModalContentRegex, newModalContent);

fs.writeFileSync(pageFile, code);
console.log("Patched page.tsx successfully.");
