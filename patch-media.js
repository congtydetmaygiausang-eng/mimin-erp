const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update video tag to have controls and remove the manual download click
code = code.replace(
  `onClick={() => {
                            if (productVideos[group.maSP]) {
                              const a = document.createElement('a');
                              a.href = productVideos[group.maSP];
                              a.download = \`video-\${group.maSP}.mp4\`;
                              a.click();
                            } else {
                              setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click();
                            }
                          }}`,
  `onClick={() => {
                            if (!productVideos[group.maSP]) {
                              setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click();
                            }
                          }}`
);

code = code.replace(
  `<video src={productVideos[group.maSP]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" muted loop playsInline controls={false} />`,
  `<video src={productVideos[group.maSP]} className="w-full h-full object-contain bg-black/40" controls playsInline />`
);

// Add a simple Image Modal state
if (!code.includes('const [viewingImage, setViewingImage]')) {
  code = code.replace(
    `const [productImages, setProductImages] = useState<Record<string, string>>({});`,
    `const [productImages, setProductImages] = useState<Record<string, string>>({});\n  const [viewingImage, setViewingImage] = useState<string | null>(null);`
  );
}

// Update image click to open modal instead of download
code = code.replace(
  `onClick={() => {
                            if (productImages[group.maSP]) {
                              const a = document.createElement('a');
                              a.href = productImages[group.maSP];
                              a.download = \`anh-bia-\${group.maSP}.png\`;
                              a.click();
                            } else {
                              setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click();
                            }
                          }}`,
  `onClick={() => {
                            if (productImages[group.maSP]) {
                              setViewingImage(productImages[group.maSP]);
                            } else {
                              setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click();
                            }
                          }}`
);

// Add the image modal at the end of the return statement
const modalHtml = `
      {/* Lightbox Modal for Image */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-5xl w-full max-h-screen flex flex-col items-center justify-center">
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={viewingImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" alt="Preview" onClick={e => e.stopPropagation()} />
            <button 
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const a = document.createElement('a');
                a.href = viewingImage;
                a.download = 'anh-san-pham.png';
                a.click();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Tải ảnh về máy
            </button>
          </div>
        </div>
      )}
`;

if (!code.includes('Lightbox Modal for Image')) {
  code = code.replace(`{/* Modal Thêm/Sửa SP */}`, modalHtml + '\n      {/* Modal Thêm/Sửa SP */}');
}

fs.writeFileSync(file, code);
console.log("Patched view/download logic perfectly");
