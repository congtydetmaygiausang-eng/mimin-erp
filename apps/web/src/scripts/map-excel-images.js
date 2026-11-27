const fs = require('fs');

const wbXml = fs.readFileSync('apps/web/public/excel_media/xl/workbook.xml', 'utf8');
const sheets = [];
const regex = /<sheet [^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g;
let m;
while ((m = regex.exec(wbXml)) !== null) {
  sheets.push({ name: m[1], sheetId: m[2], rId: m[3] });
}

const relsXml = fs.readFileSync('apps/web/public/excel_media/xl/_rels/workbook.xml.rels', 'utf8');
sheets.forEach(s => {
  const relRegex = new RegExp('Id="' + s.rId + '"[^>]*Target="([^"]+)"');
  const rm = relRegex.exec(relsXml);
  if (rm) s.target = rm[1];
});

sheets.forEach(s => {
  if (!s.target) return;
  const wsRelPath = 'apps/web/public/excel_media/xl/' + s.target.replace('worksheets/', 'worksheets/_rels/') + '.rels';
  if (fs.existsSync(wsRelPath)) {
    const wsRelXml = fs.readFileSync(wsRelPath, 'utf8');
    const drawRegex = /Type="[^"]*drawing"[^>]*Target="([^"]+)"/;
    const dm = drawRegex.exec(wsRelXml);
    if (dm) {
      s.drawing = dm[1];
      const drawRelPath = 'apps/web/public/excel_media/xl/drawings/_rels/' + dm[1].replace('../drawings/', '') + '.rels';
      if (fs.existsSync(drawRelPath)) {
        const drawRelXml = fs.readFileSync(drawRelPath, 'utf8');
        const imgRegex = /Target="([^"]*media[^"]*)"/g;
        let im;
        s.images = [];
        while ((im = imgRegex.exec(drawRelXml)) !== null) {
          s.images.push(im[1].replace('../media/', ''));
        }
      }
    }
  }
});

console.log('Final mapping:');
sheets.forEach(s => {
  console.log(`${s.name} -> images: ${s.images ? s.images.join(', ') : 'NONE'}`);
});
