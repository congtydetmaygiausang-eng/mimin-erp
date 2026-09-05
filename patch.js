const fs = require('fs');
const content = fs.readFileSync('f:/Tool/mimin-erp/apps/web/src/components/LenhCatModal.tsx', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('if (sp.dsMau && sp.dsMau.length > 0) {'));
if (startIdx !== -1) {
    const replacement = `                                    try {
                                      let dsMauToSet = sp.dsMau;
                                      if (typeof dsMauToSet === 'string') {
                                        dsMauToSet = JSON.parse(dsMauToSet);
                                      }
                                      if (Array.isArray(dsMauToSet) && dsMauToSet.length > 0) {
                                        setSoMau(dsMauToSet.length);
                                        setDsMau(dsMauToSet.map((m) => ({
                                          ten: m.ten || "",
                                          maSKU: m.maSKU || "",
                                          dinhMuc: m.dinhMuc || 0.25,
                                          img: m.img || "",
                                          maVai: "",
                                          slDuKien: 0,
                                          ghiChu: "",
                                          phanBoSize: []
                                        })));
                                      }
                                    } catch (e) {
                                      console.error("Lỗi parse dsMau khi chọn SP:", e);
                                    }`;
    lines.splice(startIdx, 12, replacement);
    fs.writeFileSync('f:/Tool/mimin-erp/apps/web/src/components/LenhCatModal.tsx', lines.join('\n'));
    console.log('Patched');
} else {
    console.log('Not found');
}
