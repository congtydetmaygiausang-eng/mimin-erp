const fs = require('fs');

const d3 = fs.readFileSync('apps/web/public/excel_media/xl/drawings/drawing3.xml', 'utf8');
const rels = fs.readFileSync('apps/web/public/excel_media/xl/drawings/_rels/drawing3.xml.rels', 'utf8');

const relMap = {};
const relRegex = /Id="([^"]+)"[^>]*Target="([^"]+)"/g;
let rm;
while ((rm = relRegex.exec(rels)) !== null) {
  relMap[rm[1]] = rm[2].replace('../media/', '');
}

const regex = /<xdr:twoCellAnchor[^>]*>([\s\S]*?)<\/xdr:twoCellAnchor>/g;
let m, idx = 0;
while ((m = regex.exec(d3)) !== null) {
  idx++;
  const block = m[1];
  const fromRow = /<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/m.exec(block)?.[1];
  const fromCol = /<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/m.exec(block)?.[1];
  const toRow = /<xdr:to>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/m.exec(block)?.[1];
  const toCol = /<xdr:to>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/m.exec(block)?.[1];
  const rId = /r:embed="([^"]+)"/.exec(block)?.[1];
  console.log(`Image ${idx} (${relMap[rId] || rId}): col ${fromCol} row ${fromRow} to col ${toCol} row ${toRow}`);
}
