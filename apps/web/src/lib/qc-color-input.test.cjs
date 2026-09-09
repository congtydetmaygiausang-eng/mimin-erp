const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const path=require('node:path');
const filename=path.join(__dirname,'stage-color-input.ts');
const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded=new Module(filename,module); loaded._compile(compiled,filename);
const {applyStageColorEntries}=loaded.exports;
const order=()=>({id:'LC-TEST',dsMau:[{ten:'Nâu đậm',tyLeSizeChiTiet:{cat:[{size:'M',sl:16}]}},{ten:'Nâu nhạt'}],phanCong:[{id:'may_ao',lichSuQC:[]},{id:'may_quan'},{id:'qc',trangThaiCD:'cho_giao'}]});
const entry=(mau,dat,loi=0,pcId='may_ao')=>({pcId,data:{mau,soLuongNhan:dat+loi,soLuongDat:dat,soLuongLoi:loi,sizes:[{size:'M',sl:dat}]}});
test('two colors: final totals are 32 passed, 0 defects; prior sizes survive',()=>{
 const original=order(); const first=applyStageColorEntries(original,[entry('Nâu đậm',16)]);
 const final=applyStageColorEntries(first.lc,[entry('Nâu nhạt',16)]);
 assert.deepEqual(final.totals.may_ao,{dat:32,loi:0});
 assert.equal(final.lc.dsMau[0].tyLeSizeChiTiet.may_ao[0].sl,16);
 assert.equal(final.lc.dsMau[0].tyLeSizeChiTiet.cat[0].sl,16);
 assert.equal(original.phanCong[0].chiTietMau,undefined);
});
test('reopening and replacing a color does not double count, including zero passed',()=>{
 let result=applyStageColorEntries(order(),[entry('Nâu đậm',15,1),entry('Nâu nhạt',14,2)]);
 assert.deepEqual(result.totals.may_ao,{dat:29,loi:3});
 result=applyStageColorEntries(result.lc,[entry('Nâu đậm',0,16)]);
 assert.deepEqual(result.totals.may_ao,{dat:14,loi:18});
 assert.equal(result.lc.phanCong[0].chiTietMau.length,2);
});
test('batch áo and quần retain separate totals and leave QC status/history untouched',()=>{
 const original=order();
 const result=applyStageColorEntries(original,[entry('Nâu đậm',15,1),entry('Nâu đậm',12,4,'may_quan')]);
 assert.deepEqual(result.totals,{may_ao:{dat:15,loi:1},may_quan:{dat:12,loi:4}});
 assert.equal(result.lc.dsMau[0].tyLeSizeChiTiet.may_quan[0].sl,12);
 assert.deepEqual(result.lc.phanCong[0].lichSuQC,[]);
 assert.equal(result.lc.phanCong[2],original.phanCong[2]);
});
test('saving cutting never fills downstream stages; later entries preserve prior stage sizes',()=>{
 let result=applyStageColorEntries({...order(),phanCong:[{id:'cat'},{id:'may_ao'},{id:'ui'}]},[entry('Nâu đậm',16,0,'cat')]);
 assert.deepEqual(Object.keys(result.lc.dsMau[0].tyLeSizeChiTiet),['cat']);
 assert.equal(result.lc.phanCong[1].chiTietMau,undefined);
 result=applyStageColorEntries(result.lc,[entry('Nâu đậm',14,2)]);
 result=applyStageColorEntries(result.lc,[entry('Nâu đậm',13,1,'ui')]);
 assert.equal(result.lc.dsMau[0].tyLeSizeChiTiet.cat[0].sl,16);
 assert.equal(result.lc.dsMau[0].tyLeSizeChiTiet.may_ao[0].sl,14);
 assert.equal(result.lc.dsMau[0].tyLeSizeChiTiet.ui[0].sl,13);
});
