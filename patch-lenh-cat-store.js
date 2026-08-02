const fs = require('fs');

const storeFile = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let code = fs.readFileSync(storeFile, 'utf8');

// 1. Define types
const typesToAdd = `
export type MauCongDoanItem = {
  id: string;
  ten: string;
  giaCong: PhanCongGiaCong;
};

export type MauChiPhiItem = {
  id: string;
  ten: string;
  chiPhi: ChiPhiCoDinh;
};

const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  { id: "AoThun", ten: "Áo Thun", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 1400 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2000 } } },
  { id: "Quan", ten: "Quần", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 900 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2500 } } },
  { id: "BoTheThao", ten: "Bộ Thể Thao", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 2300 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 4500 } } }
];

const DEFAULT_MAU_CHI_PHI: MauChiPhiItem[] = [
  { id: "AoThun", ten: "Áo Thun", chiPhi: { baoBi: 1500, temNhan: 500, khauHao: 2000 } },
  { id: "Quan", ten: "Quần", chiPhi: { baoBi: 1200, temNhan: 300, khauHao: 1500 } },
  { id: "BoTheThao", ten: "Bộ Thể Thao", chiPhi: { baoBi: 2500, temNhan: 1000, khauHao: 3500 } }
];

const STORAGE_KEY_MCD = "mimin_mau_cong_doan";
const STORAGE_KEY_MCP = "mimin_mau_chi_phi";
`;

code = code.replace(/const STORAGE_KEY = "mimin_lenh_cat_v2";/, typesToAdd + '\nconst STORAGE_KEY = "mimin_lenh_cat_v2";');

// 2. Update interface
const interfaceToAdd = `
  dsMauCongDoan: MauCongDoanItem[];
  dsMauChiPhi: MauChiPhiItem[];
  themMauCongDoan: (mau: MauCongDoanItem) => void;
  themMauChiPhi: (mau: MauChiPhiItem) => void;
  capNhatTrangThai: (id: string, tt: TrangThaiLenhCat, u: any) => void;
  reset: () => void;
`;

code = code.replace(
  /xoaLenhCat: \(id: string, nguoiXoa: AppUser\) => void;\s*\}/,
  `xoaLenhCat: (id: string, nguoiXoa: AppUser) => void;${interfaceToAdd}}`
);

// 3. Update state in Provider
const stateToAdd = `
  const [dsMauCongDoan, setDsMauCongDoan] = useState<MauCongDoanItem[]>([]);
  const [dsMauChiPhi, setDsMauChiPhi] = useState<MauChiPhiItem[]>([]);
`;

code = code.replace(
  /const \[dsLenhCat, setDsLenhCat\] = useState<LenhCat\[\]>\(\[\]\);/,
  `const [dsLenhCat, setDsLenhCat] = useState<LenhCat[]>([]);\n${stateToAdd}`
);

// 4. Load from localStorage
const loadToAdd = `
      const storedMCD = localStorage.getItem(STORAGE_KEY_MCD);
      if (storedMCD) setDsMauCongDoan(JSON.parse(storedMCD));
      else { setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN)); }
      
      const storedMCP = localStorage.getItem(STORAGE_KEY_MCP);
      if (storedMCP) setDsMauChiPhi(JSON.parse(storedMCP));
      else { setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI)); }
`;

code = code.replace(
  /setDsLenhCat\(JSON\.parse\(stored\)\);\s*\} else \{/,
  `setDsLenhCat(JSON.parse(stored));\n      } else {\n`
);
// We can just append loadToAdd inside useEffect, before setIsLoaded(true)
code = code.replace(
  /setIsLoaded\(true\);/,
  `${loadToAdd}\n    setIsLoaded(true);`
);

// 5. Add handlers
const handlersToAdd = `
  const themMauCongDoan = useCallback((mau: MauCongDoanItem) => {
    setDsMauCongDoan(prev => { const next = [...prev, mau]; localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next)); return next; });
  }, []);
  const themMauChiPhi = useCallback((mau: MauChiPhiItem) => {
    setDsMauChiPhi(prev => { const next = [...prev, mau]; localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(next)); return next; });
  }, []);
  const capNhatTrangThai = useCallback((id: string, tt: TrangThaiLenhCat, u: any) => {
    setDsLenhCat(prev => { const next = prev.map(x => x.id === id ? { ...x, trangThai: tt } : x); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });
  }, []);
  const reset = useCallback(() => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
    setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));
  }, []);
`;

code = code.replace(
  /const xoaLenhCat = useCallback[\s\S]*?\}, \[\]\);/,
  `$&
  ${handlersToAdd}`
);

// 6. Provide values
code = code.replace(
  /value=\{\{ dsLenhCat, themLenhCat, suaLenhCat, xoaLenhCat \}\}/,
  `value={{ dsLenhCat, themLenhCat, suaLenhCat, xoaLenhCat, dsMauCongDoan, dsMauChiPhi, themMauCongDoan, themMauChiPhi, capNhatTrangThai, reset }}`
);

fs.writeFileSync(storeFile, code);
console.log("Patched lenh-cat-store.tsx successfully.");
