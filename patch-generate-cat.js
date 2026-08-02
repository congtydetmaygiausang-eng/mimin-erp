const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const genOld = `// Tự động generate danh sách SP thành phẩm từ các phiếu DG_ (Đóng gói) hoàn thành
function generateSanPhamFromWorkflow(): SanPhamTP[] {
  const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {
    const sl = p.soLuongDat || 0;
    const dg = p.donGia || 0;
    return {
      id: p.id,
      maSP: p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: p.mau || "Trắng",
      size: p.size || "M",
      lsx: p.lenhSX,
      ngayNhap: p.ngayHoanThanh || new Date().toISOString().slice(0, 10),
      soLuong: sl,
      donGia: dg * 5, // Đơn giá bán = 5x công may
      giaTri: sl * dg * 5,
      viTri: \`Kệ \${String.fromCharCode(65 + Math.floor(i / 5))}\${(i % 5) + 1}-\${(i % 5) + 2}\`,
      trangThai: "con",
      ghiChu: p.ghiChu,
    } as SanPhamTP;
  });
}`;

const genNew = `// Tự động generate danh sách SP thành phẩm từ các phiếu CẮT (CAT_)
function generateSanPhamFromWorkflow(): SanPhamTP[] {
  const dsCat = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("CAT_"));
  return dsCat.map((cat: any, i) => {
    const lsx = cat.lenhSX;
    
    // Tìm tất cả các phiếu thuộc về cùng 1 LSX để tính tổng giá vốn
    const cacPhieuThuocLsx = ALL_PHIEU.filter(p => p.lenhSX === lsx);
    
    // Tính tổng tiền gia công cho 1 cái áo
    let tongGiaVonDonVi = 0;
    cacPhieuThuocLsx.forEach(p => {
        tongGiaVonDonVi += (p.donGia || 0);
    });
    
    // Số lượng lấy từ số lượng đạt của lệnh cắt
    const sl = cat.soLuongDat || cat.soLuongGiao || 0;
    
    // Trạng thái: Nếu đã có DG (Đóng gói) hoàn thành thì là "con", nếu chưa thì là "dat-hang" (Đang sản xuất)
    const isCompleted = cacPhieuThuocLsx.some((p: any) => p.id?.startsWith("DG_") && p.trangThai === "Hoàn thành");

    return {
      id: cat.id,
      maSP: cat.maSP || "M001",
      tenSP: cat.phanLoai,
      phanLoai: cat.phanLoai,
      mau: cat.mau || "Trắng",
      size: cat.size || "M",
      tiLeSize: "",
      lsx: cat.lenhSX,
      ngayNhap: cat.ngayHoanThanh || new Date().toISOString().slice(0, 10),
      soLuong: sl,
      donGia: tongGiaVonDonVi > 0 ? tongGiaVonDonVi * 1.5 : 50000, // Tạm tính Giá bán = Giá vốn * 1.5
      giaTri: sl * (tongGiaVonDonVi > 0 ? tongGiaVonDonVi * 1.5 : 50000),
      viTri: \`Kệ \${String.fromCharCode(65 + Math.floor(i / 5))}\${(i % 5) + 1}-\${(i % 5) + 2}\`,
      trangThai: isCompleted ? "con" : "dat-hang", 
      ghiChu: cat.ghiChu,
    } as SanPhamTP;
  });
}`;

code = code.replace(genOld, genNew);

// Add "Đang sản xuất" status visually for "dat-hang"
const badgeOld = `{s.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded font-bold w-fit">Đã đặt</span>}`;
const badgeNew = `{s.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold w-fit">Đang sản xuất</span>}`;
code = code.replace(badgeOld, badgeNew);

const badgeOld2 = `{s.trangThai === "dat-hang" && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">Đã đặt</span>}`;
const badgeNew2 = `{s.trangThai === "dat-hang" && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">Đang sản xuất</span>}`;
code = code.replace(badgeOld2, badgeNew2);

const optionOld = `<option value="dat-hang">Đã đặt hàng</option>`;
const optionNew = `<option value="dat-hang">Đang sản xuất</option>`;
code = code.replace(optionOld, optionNew);

fs.writeFileSync(file, code);
