const fs = require('fs');
const filePath = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add localStorage load to useEffect
content = content.replace(
`  // Load Lệnh Cắt từ Supabase
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {`,
`  // Load Lệnh Cắt từ Supabase
  useEffect(() => {
    let mounted = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDsLenhCat(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }

    const loadData = async () => {`
);

// 2. Update setDsLenhCat in the same useEffect
content = content.replace(
`            setDsLenhCat((prev) => [
              ...(mapped as LenhCat[]),
              ...prev.filter((x) => !remoteIds.has(x.id)),
            ]);`,
`            setDsLenhCat((prev) => {
              const next = [
                ...(mapped as LenhCat[]),
                ...prev.filter((x) => !remoteIds.has(x.id)),
              ];
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            });`
);

// 3. Update themLenhCat
content = content.replace(
`    setDsLenhCat((prev) => [lenh, ...prev]);`,
`    setDsLenhCat((prev) => {
      const next = [lenh, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`
);

// 4. Update suaLenhCat
content = content.replace(
`    setDsLenhCat((prev) => prev.map((item) => item.id === id ? { ...item, ...lenh } : item));`,
`    setDsLenhCat((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, ...lenh } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`
);

// 5. Update xoaLenhCat
content = content.replace(
`    setDsLenhCat((prev) => prev.filter((item) => item.id !== id));`,
`    setDsLenhCat((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
