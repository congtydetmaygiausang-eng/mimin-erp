const fs = require('fs');
const filePath = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `  // Load Lệnh Cắt từ Supabase
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");`;

const replacement1 = `  // Load Lệnh Cắt từ Supabase và LocalStorage
  useEffect(() => {
    let mounted = true;
    
    // 1. Tải tức thời từ localStorage để có dữ liệu ngay (chống giật và mất dữ liệu khi F5)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDsLenhCat(parsed);
        }
      }
    } catch (e) {
      console.error("Lỗi đọc Lệnh cắt từ local", e);
    }

    const loadData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");`;

content = content.replace(target1, replacement1);

const target2 = `    setDsLenhCat((prev) => [lenh, ...prev]);`;
const replacement2 = `    setDsLenhCat((prev) => {
      const next = [lenh, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`;
content = content.replace(target2, replacement2);

const target3 = `    setDsLenhCat((prev) => prev.map((item) => item.id === id ? { ...item, ...lenh } : item));`;
const replacement3 = `    setDsLenhCat((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, ...lenh } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`;
content = content.replace(target3, replacement3);

const target4 = `    setDsLenhCat((prev) => prev.filter((item) => item.id !== id));`;
const replacement4 = `    setDsLenhCat((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`;
content = content.replace(target4, replacement4);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
