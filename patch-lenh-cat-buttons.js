const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// For block 1 (GIA CÔNG) - Add button next to select
// Current HTML:
// <div className="flex justify-between items-center border-b border-black/10 pb-2">
//   <h3 className="font-bold text-slate-800">1. GIA CÔNG SẢN XUẤT</h3>
//   <select ...>
// We want to wrap the select and button in a div.
code = code.replace(
  /(<h3 className="font-bold text-slate-800">1\. GIA CÔNG SẢN XUẤT<\/h3>)\s*(<select[\s\S]*?<\/select>)/,
  `$1\n<div className="flex items-center gap-2">\n$2\n<button type="button" onClick={() => setShowTaoMauCD(true)} className="px-2 py-1 text-xs bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap shadow-sm">+ Tạo mẫu</button>\n</div>`
);

// For block 2 (CHI PHÍ CỐ ĐỊNH) - Add button next to select
// Current HTML:
// <div className="flex justify-between items-center border-b border-black/10 pb-2 mb-3">
//   <h3 className="font-bold text-slate-800">2. CHI PHÍ CỐ ĐỊNH / SẢN PHẨM</h3>
//   <select ...>
code = code.replace(
  /(<h3 className="font-bold text-slate-800">2\. CHI PHÍ CỐ ĐỊNH \/ SẢN PHẨM<\/h3>)\s*(<select[\s\S]*?<\/select>)/,
  `$1\n<div className="flex items-center gap-2">\n$2\n<button type="button" onClick={() => setShowTaoMauCP(true)} className="px-2 py-1 text-xs bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap shadow-sm">+ Tạo mẫu</button>\n</div>`
);


fs.writeFileSync(modalFile, code);
console.log("Patched LenhCatModal.tsx successfully (added missing buttons).");
