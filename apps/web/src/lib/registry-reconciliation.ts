import { normalizeRegistryValue } from "@/lib/vietqr-business";

export type RegistryProvider="VIETQR"|"MASOTHUE";
export type RegistryFieldName="TAX_CODE"|"LEGAL_NAME"|"REGISTERED_ADDRESS"|"TAXPAYER_STATUS";
export type FieldComparisonStatus="MATCH"|"PARTIAL"|"CONFLICT"|"MISSING_SOURCE";
export type ReconciliationStatus="MATCH"|"PARTIAL"|"CONFLICT"|"INSUFFICIENT";

export interface RegistryEvidenceValue {
  provider:RegistryProvider;
  fieldName:RegistryFieldName;
  fieldValue:string;
  normalizedValue:string;
  sourceUrl:string;
  capturedAt:string;
}

export interface RegistryFieldComparison {
  fieldName:RegistryFieldName;
  vietQrValue:string;
  maSoThueValue:string;
  normalizedVietQr:string;
  normalizedMaSoThue:string;
  similarity:number;
  status:FieldComparisonStatus;
  reason:string;
}

export interface RegistryReconciliation {
  formulaVersion:"registry-v3.1";
  overallStatus:ReconciliationStatus;
  matchScore:number;
  matchedFields:number;
  partialFields:number;
  conflictFields:number;
  missingFields:number;
  fields:RegistryFieldComparison[];
}

const FIELD_CONFIG:Record<RegistryFieldName,{weight:number;match:number;partial:number}>={
  TAX_CODE:{weight:35,match:1,partial:1},
  LEGAL_NAME:{weight:30,match:.86,partial:.66},
  REGISTERED_ADDRESS:{weight:25,match:.82,partial:.58},
  TAXPAYER_STATUS:{weight:10,match:.88,partial:.68},
};

function tokens(value:string):Set<string>{
  return new Set(normalizeRegistryValue(value).split(" ").filter(token=>token.length>1));
}

function jaccard(left:string,right:string):number{
  const a=tokens(left),b=tokens(right);
  if(!a.size||!b.size)return 0;
  let intersection=0;
  for(const token of a)if(b.has(token))intersection+=1;
  return intersection/(a.size+b.size-intersection);
}

function compare(fieldName:RegistryFieldName,vietQr?:RegistryEvidenceValue,maSoThue?:RegistryEvidenceValue):RegistryFieldComparison{
  const vietQrValue=vietQr?.fieldValue.trim()??"";
  const maSoThueValue=maSoThue?.fieldValue.trim()??"";
  const normalizedVietQr=vietQr?.normalizedValue||normalizeRegistryValue(vietQrValue);
  const normalizedMaSoThue=maSoThue?.normalizedValue||normalizeRegistryValue(maSoThueValue);
  if(!vietQrValue||!maSoThueValue)return{fieldName,vietQrValue,maSoThueValue,normalizedVietQr,normalizedMaSoThue,similarity:0,status:"MISSING_SOURCE",reason:!vietQrValue&&!maSoThueValue?"Cả hai nguồn đều thiếu dữ liệu":!vietQrValue?"VietQR chưa có dữ liệu":"MaSoThue chưa có dữ liệu"};
  const similarity=normalizedVietQr===normalizedMaSoThue?1:fieldName==="TAX_CODE"?0:jaccard(vietQrValue,maSoThueValue);
  const config=FIELD_CONFIG[fieldName];
  const rounded=Math.round(similarity*100);
  if(similarity>=config.match)return{fieldName,vietQrValue,maSoThueValue,normalizedVietQr,normalizedMaSoThue,similarity:rounded,status:"MATCH",reason:"Hai nguồn khớp"};
  if(similarity>=config.partial)return{fieldName,vietQrValue,maSoThueValue,normalizedVietQr,normalizedMaSoThue,similarity:rounded,status:"PARTIAL",reason:"Hai nguồn tương đồng nhưng cần người dùng kiểm tra"};
  return{fieldName,vietQrValue,maSoThueValue,normalizedVietQr,normalizedMaSoThue,similarity:rounded,status:"CONFLICT",reason:"Hai nguồn có dữ liệu mâu thuẫn"};
}

export function reconcileRegistryEvidence(evidence:RegistryEvidenceValue[]):RegistryReconciliation{
  const byKey=new Map(evidence.map(item=>[`${item.provider}:${item.fieldName}`,item]));
  const fields=(Object.keys(FIELD_CONFIG) as RegistryFieldName[]).map(fieldName=>compare(fieldName,byKey.get(`VIETQR:${fieldName}`),byKey.get(`MASOTHUE:${fieldName}`)));
  const comparable=fields.filter(field=>field.status!=="MISSING_SOURCE");
  const matchedFields=fields.filter(field=>field.status==="MATCH").length;
  const partialFields=fields.filter(field=>field.status==="PARTIAL").length;
  const conflictFields=fields.filter(field=>field.status==="CONFLICT").length;
  const missingFields=fields.filter(field=>field.status==="MISSING_SOURCE").length;
  const availableWeight=comparable.reduce((sum,field)=>sum+FIELD_CONFIG[field.fieldName].weight,0);
  const weightedScore=comparable.reduce((sum,field)=>sum+FIELD_CONFIG[field.fieldName].weight*field.similarity,0);
  const matchScore=availableWeight?Math.round(weightedScore/availableWeight):0;
  const taxConflict=fields.some(field=>field.fieldName==="TAX_CODE"&&field.status==="CONFLICT");
  let overallStatus:ReconciliationStatus;
  if(comparable.length<2)overallStatus="INSUFFICIENT";
  else if(taxConflict||conflictFields>=2||matchScore<55)overallStatus="CONFLICT";
  else if(conflictFields===0&&partialFields===0)overallStatus="MATCH";
  else overallStatus="PARTIAL";
  return{formulaVersion:"registry-v3.1",overallStatus,matchScore,matchedFields,partialFields,conflictFields,missingFields,fields};
}
