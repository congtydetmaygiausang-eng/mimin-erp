const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const path=require('node:path');
function load(relative,mocks={}) {
 const filename=path.resolve(__dirname,relative);
 const loaded=new Module(filename,module);loaded.paths=module.paths;
 loaded.require=(name)=>name in mocks?mocks[name]:require(name);
 loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,filename);
 return loaded.exports;
}
const stage=load('production-stage-order.ts');
const stages=[{id:'assigned-34',tenCongDoan:'Gia công may áo'},{id:'assigned-12',tenCongDoan:'Nhân viên cắt'},{id:'assigned-56',tenCongDoan:'Công đoạn ủi'},{id:'dongGoi',tenCongDoan:'Đóng gói'},{id:'mayQuan',tenCongDoan:'May quần'},{id:'qc',tenCongDoan:'QC'}];
const mau={ten:'Nâu đậm',phanBoSize:[{size:'M',sl:16}],tyLeSizeChiTiet:Object.fromEntries(stages.map(pc=>[pc.id,[{size:'M',sl:16}]]))};
test('cutting history excludes itself and all later stages, including generated assignment IDs',()=>{
 assert.deepEqual(stage.previousProductionStages(stages,[{id:'cat',tenCongDoan:''}],mau),[]);
});
test('QC history is chronological and excludes ironing, packaging and QC',()=>{
 assert.deepEqual(stage.previousProductionStages(stages,[{id:'qc',tenCongDoan:''}],mau).map(pc=>pc.id),['assigned-12','assigned-34','mayQuan']);
});
test('a sewing branch is not history of the parallel sewing branch; unentered zero rows are omitted',()=>{
 const zero={...mau,tyLeSizeChiTiet:{...mau.tyLeSizeChiTiet,'assigned-12':[{size:'M',sl:0}]}};
 assert.deepEqual(stage.previousProductionStages(stages,[stages[4]],zero),[]);
 const saved=stages.map(pc=>pc.id==='assigned-12'?{...pc,chiTietMau:[{mau:mau.ten,soLuongNhan:16,soLuongDat:0,soLuongLoi:16}]}:pc);
 assert.equal(stage.previousProductionStages(saved,[stages[4]],zero).length,1);
});
const react={createElement:(type,props,...children)=>({type,props:{...props,children}}),useState:initial=>[typeof initial==='function'?initial():initial,()=>{}]};
const {TyLeSizeModal}=load('../components/modals/TyLeSizeModal.tsx',{
 react,
 '@/components/ui/ResponsiveModal':{ResponsiveModal:'modal'},
 '@/components/ui/Portal':{Portal:'portal'},
 '@/lib/production-stage-order':stage,
});
function nodes(node) {if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
test('size table only permits cutting inputs and only saves cutting keys',()=>{
 let saved;
 const tree=TyLeSizeModal({lc:{id:'LC-TEST',loaiSP:'AoCoTron',phanCong:stages,dsMau:[mau]},mauIdx:0,onClose:()=>{},onSave:(_index,data)=>saved=data});
 const all=nodes(tree),inputs=all.filter(node=>node.type==='input');
 assert.equal(inputs.filter(node=>!node.props.disabled).length,1);
 assert.equal(inputs.filter(node=>node.props.disabled).length,5);
 const save=all.find(node=>node.type==='button'&&node.props.children.includes(' Lưu thông số'));
 assert.ok(save);save.props.onClick();assert.deepEqual(Object.keys(saved),['assigned-12']);
});
test('downstream table reflects updated stage data and does not label unentered zero as defects',()=>{
 const blank={...mau,tyLeSizeChiTiet:{'assigned-12':[{size:'M',sl:16}]}};
 const render=color=>TyLeSizeModal({lc:{id:'LC-TEST',loaiSP:'AoCoTron',phanCong:stages,dsMau:[color]},mauIdx:0,onClose:()=>{},onSave:()=>{}});
 assert.ok(JSON.stringify(render(blank)).includes('Chưa nhập'));
 const updated={...blank,tyLeSizeChiTiet:{...blank.tyLeSizeChiTiet,'assigned-34':[{size:'M',sl:14}]}};
 assert.ok(nodes(render(updated)).some(node=>node.type==='input'&&node.props.disabled&&node.props.value===14));
});
function modalHarness() {
 const state=[],effects=[];let cursor=0,pending=[];
 const hooks={...react,useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useEffect(fn,deps){const i=cursor++;if(!effects[i]||deps.some((dep,n)=>!Object.is(dep,effects[i][n]))){effects[i]=deps;pending.push(fn);}}};
 const {ChiTietMauHistoryModal}=load('../components/ui/ChiTietMauHistoryModal.tsx',{react:hooks,'@/lib/production-stage-order':stage});
 return props=>{cursor=0;pending=[];const tree=ChiTietMauHistoryModal(props);pending.forEach(fn=>fn());return tree;};
}
test('quantity draft survives realtime object replacements and resets for the next color',async()=>{
 const render=modalHarness();let saved;
 const pc={id:'in_theu',tenCongDoan:'In/Thêu'};
 const color={ten:'Đậm',phanBoSize:[{size:'M',sl:8}],tyLeSizeChiTiet:{cat:[{size:'M',sl:8}]}};
 let props={isOpen:true,lc:{id:'LC-TEST',dsMau:[color],phanCong:[{id:'cat',tenCongDoan:'Cắt'},pc]},mau:color,currentPCs:[pc],onClose:()=>{},onSave:()=>{},onSaveBatch:async entries=>{saved=entries;return true;}};
 render(props);let tree=render(props);
 nodes(tree).find(n=>n.type==='input'&&n.props.min==='0').props.onChange({target:{value:'8'}});
 props={...props,lc:structuredClone(props.lc),mau:structuredClone(color),currentPCs:[{...pc}]};
 tree=render(props);tree=render(props);
 assert.equal(nodes(tree).find(n=>n.type==='input'&&n.props.min==='0').props.value,8);
 await nodes(tree).find(n=>n.type==='button'&&n.props.children.includes(' Lưu & Đóng')).props.onClick();
 assert.equal(saved[0].data.soLuongDat,8);assert.equal(saved[0].data.soLuongLoi,0);
 props={...props,mau:{...color,ten:'Nhạt'}};render(props);tree=render(props);
 assert.equal(nodes(tree).find(n=>n.type==='input'&&n.props.min==='0').props.value,'');
});
test('saving untouched zero-passed input requires explicit all-defect confirmation',async()=>{
 const render=modalHarness();let saves=0;global.window={confirm:()=>false};
 const color={ten:'Đậm',phanBoSize:[{size:'M',sl:8}],tyLeSizeChiTiet:{cat:[{size:'M',sl:8}]}};
 const pc={id:'in_theu',tenCongDoan:'In/Thêu'};
 const props={isOpen:true,lc:{id:'LC-TEST',dsMau:[color],phanCong:[{id:'cat',tenCongDoan:'Cắt'},pc]},mau:color,currentPCs:[pc],onClose:()=>{},onSave:()=>{},onSaveBatch:async()=>{saves++;return true;}};
 render(props);let tree=render(props);
 await nodes(tree).find(n=>n.type==='button'&&n.props.children.includes(' Lưu & Đóng')).props.onClick();
 assert.equal(saves,0);delete global.window;
});
