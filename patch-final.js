const fs = require('fs');
const filePath = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Initial Load in useEffect
content = content.replace(
  '  // Load Lệnh Cắt từ Supabase\n  useEffect(() => {\n    let mounted = true;\n    const loadData = async () => {\n      try {\n        const { supabase } = await import("@/lib/supabase/client");',
  '  // Load Lệnh Cắt từ Supabase và LocalStorage\n  useEffect(() => {\n    let mounted = true;\n    try {\n      const stored = localStorage.getItem(STORAGE_KEY);\n      if (stored) {\n        const parsed = JSON.parse(stored);\n        if (Array.isArray(parsed) && parsed.length > 0) setDsLenhCat(parsed);\n      }\n    } catch(e) {}\n\n    const loadData = async () => {\n      try {\n        const { supabase } = await import("@/lib/supabase/client");'
);

// 2. themLenhCat
content = content.replace(
  'setDsLenhCat((prev) => [lenh, ...prev]);',
  'setDsLenhCat((prev) => { const next = [lenh, ...prev]; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });'
);

// 3. suaLenhCat
content = content.replace(
  'setDsLenhCat((prev) => prev.map((item) => item.id === id ? { ...item, ...lenh } : item));',
  'setDsLenhCat((prev) => { const next = prev.map((item) => item.id === id ? { ...item, ...lenh } : item); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });'
);

// 4. xoaLenhCat
content = content.replace(
  'setDsLenhCat((prev) => prev.filter((item) => item.id !== id));',
  'setDsLenhCat((prev) => { const next = prev.filter((item) => item.id !== id); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });'
);

// 5. reset (using regex)
const regex = /const reset = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/;

const replacement = `const reset = useCallback(async () => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("phan_cong").delete().neq("id", "x");
        await supabase.from("lenh_cat").delete().neq("id", "x");
      }
    } catch(e) { console.error("Loi reset", e); }
  }, []);`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('All patches success!');
} else {
  console.log('Target not found for reset patch!');
}
