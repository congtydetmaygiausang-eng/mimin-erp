// @codex T3: bộ lọc xác định tên và địa chỉ doanh nghiệp; không suy đoán dữ liệu thiếu.

const ARTICLE_NAME_PATTERN = /\b(?:danh\s*(?:bạ|sách)|điểm danh|khu chợ|tổng hợp|bài viết|top\s*\d+|là gì|ưu điểm|nhược điểm|bảng giá|giá sỉ|ở đâu|bán loại.+nào|các mẫu|hướng dẫn|quy trình|tuyển dụng|tìm việc|nhận gia công|tham quan|cung cấp.+ở\s+(?:quận|huyện|tp)|công ty.+(?:ở\s*)?tại\s+(?:quận|huyện|tp)|xưởng.+(?:ở\s*)?tại\s+(?:quận|huyện|tp))\b/i;
const BUSINESS_MARKER_PATTERN = /\b(?:công\s*ty|cty|tnhh|trách nhiệm hữu hạn|cổ phần|doanh nghiệp|nhà máy|xưởng|hộ kinh doanh|cửa hàng|supplier|manufacturer)\b/i;
const ADDRESS_ADMIN_PATTERN = /\b(?:phường|p\.?\s*\d+|xã|quận|q\.?\s*\d+|huyện|thành phố|tp\.?\s*hcm|tỉnh|thị xã|thị trấn)\b/gi;
const ADDRESS_ROUTE_PATTERN = /(?:đường|đ\.?\s*[a-zà-ỹ]|phố|ấp|thôn|khu phố|khu công nghiệp|kcn|cụm công nghiệp|lô|tổ)(?:\s|,)/i;
const ADDRESS_PROSE_PATTERN = /\b(?:cập nhật gần nhất|ngành\s*:|tình trạng|là một trong|sản phẩm|giá thành|ưu điểm|nhược điểm|quy trình|khai trường|chuyên sản xuất|chuyên nhập khẩu|hàng đầu)\b/i;

function compact(value:string,maximum:number):string{return value.replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").replace(/^[\s,;:|\-–—]+|[\s,;:|\-–—]+$/g,"").slice(0,maximum)}

export function cleanCompanyLegalName(value:string):string{
  let text=compact(value,500)
    .replace(/!\[.*?\]\(.*?\)/g,"")
    .replace(/\[(.*?)\]\(.*?\)/g,"$1")
    .replace(/^(?:image|hình)\s*\d+\s*[:.\-–—]*\s*/i,"")
    .replace(/^\d{10}(?:-\d{3})?\s*[-–—|:]\s*/,"")
    .replace(/\s*[-–—|]\s*(?:masothue|mã số thuế)\s*$/i,"");
  const hasMarketingSuffix=/\s[-–—|]\s.*\b(?:sản xuất|phân phối|giá sỉ|toàn quốc)\b/i.test(text);
  if(/[?？]/.test(text)||/danh\s*(?:bạ|sách)/i.test(text)||ARTICLE_NAME_PATTERN.test(text)||hasMarketingSuffix)return"";
  const embedded=text.match(/\b(?:công\s*ty|cty)\s+(?:tnhh|trách nhiệm hữu hạn|cổ phần|cp|một thành viên|mtv)?\s*[^|\n]{2,180}/i)?.[0];
  if(embedded)text=embedded;
  text=compact(text.split(/\s+(?:ngành|địa chỉ|mã số thuế|mst|điện thoại|hotline|website)\s*[:#-]/i)[0]??"",200)
    .replace(/\s*[-–—|]\s*(?:masothue|trang vàng|yellow pages)\s*$/i,"");
  if(!text||text.length<3||/[?？]/.test(text)||ARTICLE_NAME_PATTERN.test(text))return"";
  const words=text.split(/\s+/).length;
  if(words>24||(/[.!?]{1,}/.test(text)&&!BUSINESS_MARKER_PATTERN.test(text)))return"";
  return text;
}

function addressCandidates(value:string):string[]{
  const normalized=compact(value,1_500)
    .replace(/^(?:image|hình)\s*\d+\s*[:.\-–—]*\s*/i,"")
    .replace(/https?:\/\/\S+|www\.\S+/gi," ")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi," ");
  const labelled=Array.from(normalized.matchAll(/(?:địa chỉ(?: thuế)?|trụ sở(?: chính)?|văn phòng|nhà máy|xưởng)\s*[:#-]\s*([^|\n]{8,320})/gi)).map((match)=>match[1]);
  const routed=Array.from(normalized.matchAll(/(?:^|[\s,|;:])((?:số\s*)?\d{1,5}(?:[/-][a-z0-9]+)*(?=[^|;\n]{0,24}(?:đường|phố|ấp|thôn|khu phố|khu công nghiệp|kcn|cụm công nghiệp|lô|tổ)(?:\s|,))[^|;\n]{5,300})/gi)).map((match)=>match[1]);
  const explicitlyNumbered=Array.from(normalized.matchAll(/(?:^|[\s,|;:])((?:số\s+)\d{1,5}(?:[/-][a-z0-9]+)*[^|;\n]{5,300})/gi)).map((match)=>match[1]);
  return[...labelled,...routed,...explicitlyNumbered,normalized];
}

export function cleanCompanyPostalAddress(value:string):string{
  for(const raw of addressCandidates(value)){
    const candidate=compact(raw
      .replace(/^(?:image|hình)\s*\d+\s*[:.\-–—]*\s*/i,"")
      .split(/\s+(?:tình trạng|tên quốc tế|tên viết tắt|người đại diện|điện thoại|hotline|email|website|facebook|mã số thuế|mst|ngành nghề)\s*[:#-]?/i)[0]??"",260);
    if(!candidate||ADDRESS_PROSE_PATTERN.test(candidate))continue;
    const adminCount=(candidate.match(ADDRESS_ADMIN_PATTERN)??[]).length;
    const hasPremise=/(?:^|[,\s])(?:số\s*)?\d{1,5}(?:[/-][a-z0-9]+)*/i.test(candidate);
    const hasRoute=ADDRESS_ROUTE_PATTERN.test(candidate);
    if(adminCount>=1&&hasPremise&&hasRoute)return candidate;
    if(adminCount>=1&&/^số\s+\d/i.test(candidate))return candidate;
    if(adminCount>=2&&hasPremise)return candidate;
  }
  return"";
}

export function isCompanyIdentityName(value:string):boolean{
  const cleaned=cleanCompanyLegalName(value);
  if(!cleaned)return false;
  return BUSINESS_MARKER_PATTERN.test(cleaned)||cleaned.split(/\s+/).length<=10;
}
