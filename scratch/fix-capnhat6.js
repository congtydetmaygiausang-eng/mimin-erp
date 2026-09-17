const fs = require('fs');
const file = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  const capNhatCongDoan = useCallback((lenhId: string, congDoanId: string, data: any) => {
    let finalPhanCong: any = null;
    let congNoSyncInfo: any = null;

    setDsLenhCat(prev => {
      const lcCurrent = prev.find(x => x.id === lenhId);
      if (!lcCurrent) return prev;

      finalPhanCong = lcCurrent.phanCong.map((pc: any) => {
        if (pc.id === congDoanId) {
          return {
            ...pc,
            trangThaiCD: data.trangThaiCD ?? pc.trangThaiCD,
            soLuongHoanThanh: data.soLuongHoanThanh ?? pc.soLuongHoanThanh,
            soLuongLoi: data.soLuongLoi ?? pc.soLuongLoi,
            lyDoLoi: data.lyDoLoi ?? pc.lyDoLoi,
            thanhTien: data.thanhTien ?? pc.thanhTien,
            conLai: data.conLai ?? pc.conLai,
            catChiTiet: data.catChiTietUpdate 
              ? { ...(pc.catChiTiet || {}), ...data.catChiTietUpdate } 
              : (data.catChiTiet ?? pc.catChiTiet),
            chiTietMau: data.chiTietMau ?? pc.chiTietMau,
            lichSuQC: data.lichSuQC ?? pc.lichSuQC,
            soLuongSuaXong: data.soLuongSuaXong ?? pc.soLuongSuaXong,
            soLuongPhePham: data.soLuongPhePham ?? pc.soLuongPhePham,
            soLuongDatCuoi: data.soLuongDatCuoi ?? pc.soLuongDatCuoi,
            lichSuNhapSL: data.lichSuNhapSL 
              ? [...(pc.lichSuNhapSL || []), ...data.lichSuNhapSL]
              : pc.lichSuNhapSL,
            ngayNhanViec: data.trangThaiCD === 'dang_lam' && !pc.ngayNhanViec
              ? new Date().toISOString().slice(0, 10)
              : pc.ngayNhanViec,
            ngayHoanThanh: data.trangThaiCD === 'hoan_thanh'
              ? new Date().toISOString().slice(0, 10)
              : pc.ngayHoanThanh,
          };
        }
        return pc;
      });

      if (data.trangThaiCD === 'hoan_thanh') {
        const pc = finalPhanCong.find((x: any) => x.id === congDoanId);
        if (pc && pc.nguoiMa) {
          const slDeTinhCongNo =
            data.soLuongDatCuoi ?? pc.soLuongDatCuoi ??
            data.soLuongHoanThanh ?? pc.soLuongHoanThanh ??
            pc.soLuong ?? lcCurrent.tongSL;
          congNoSyncInfo = {
            lenhCatId: lenhId,
            congDoan: pc.tenCongDoan || "Gia công",
            nguoiMa: pc.nguoiMa,
            nguoiTen: pc.nguoiTen || "Chưa rõ",
            donGia: pc.donGia || 0,
            soLuongGiao: slDeTinhCongNo,
            ngayGiao: pc.ngayNhanViec,
            daThanhToan: pc.daThanhToan || 0,
          };
        }
      }

      const next = prev.map(lc => lc.id === lenhId ? { ...lc, phanCong: finalPhanCong } : lc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    const newPhanCong = finalPhanCong;`;

const startIdx = content.indexOf("  const capNhatCongDoan = useCallback((lenhId: string, congDoanId: string, data: {");
if (startIdx === -1) {
  console.log('not found start');
  process.exit(1);
}

const endStr = "    const newPhanCong = finalPhanCong;";
let endIdx = content.indexOf(endStr, startIdx);

if (endIdx === -1) {
  const endStrAlt = `      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });`;
  endIdx = content.indexOf(endStrAlt, startIdx);
  if (endIdx !== -1) {
    endIdx += endStrAlt.length;
  }
} else {
  endIdx += endStr.length;
}

if (endIdx === -1 || endIdx <= startIdx) {
  console.log('not found end');
  process.exit(1);
}

content = content.substring(0, startIdx) + replacement + content.substring(endIdx);

content = content.replace(
  `    catChiTiet?: CatChiTiet;
    chiTietMau?: any;`,
  `    catChiTiet?: CatChiTiet;
    catChiTietUpdate?: Partial<CatChiTiet>;
    chiTietMau?: any;`
);

fs.writeFileSync(file, content);
console.log('done!');
