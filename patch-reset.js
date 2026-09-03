const fs = require('fs');
const filePath = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `  const reset = useCallback(() => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
  }, []);`;

const replacement = `  const reset = useCallback(async () => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
    
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("lenh_cat").delete().neq("id", "x");
      }
    } catch (e) {
      console.error("Lỗi reset Supabase", e);
    }
  }, []);`;

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
