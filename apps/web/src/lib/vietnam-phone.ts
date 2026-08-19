const PHONE_PATTERN = /(?<!\d)(?:\+?84|0)(?:[\s().-]*\d){8,10}(?!\d)/g;
const TAX_CODE_PATTERN = /(?:mã số thuế|mst|tax code)\s*[:#-]?\s*(\d{10}(?:-?\d{3})?)/gi;

export function normalizeVietnamPhone(value: string): string {
  let phone = value.replace(/\D/g, "");
  if (phone.startsWith("84") && phone.length >= 11) phone = `0${phone.slice(2)}`;
  if (/^(?:03|05|07|08|09)\d{8}$/.test(phone)) return phone;
  if (/^02\d{8,9}$/.test(phone)) return phone;
  if (/^(?:1800|1900)\d{4,6}$/.test(phone)) return phone;
  return "";
}

export function extractVietnamPhones(value: string, limit = 5): string[] {
  const taxCodes = new Set(Array.from(value.matchAll(TAX_CODE_PATTERN)).flatMap((match) => {
    const taxCode = match[1].replace(/\D/g, "");
    return [taxCode, taxCode.slice(0, 10)];
  }));
  return Array.from(new Set((value.match(PHONE_PATTERN) ?? []).map(normalizeVietnamPhone).filter((phone) => phone && !taxCodes.has(phone)))).slice(0, limit);
}

export function extractVietnamContactPhones(value: string, limit = 5): string[] {
  const labelledSegments = Array.from(value.matchAll(/(?:điện thoại|hotline|phone|tel(?:ephone)?|liên hệ|call|tel:)\s*[:#-]?\s*([^\n|<>]{8,100})/gi), (match) => match[0]);
  return Array.from(new Set(labelledSegments.flatMap((segment) => extractVietnamPhones(segment, limit)))).slice(0, limit);
}

export function formatVietnamPhone(value: string): string {
  const phone = normalizeVietnamPhone(value);
  if (!phone) return "";
  if (/^(?:03|05|07|08|09)/.test(phone)) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  if (/^(?:024|028)/.test(phone) && phone.length === 11) return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
  if (phone.startsWith("02") && phone.length === 11) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  if (phone.startsWith("02")) return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  return `${phone.slice(0, 4)} ${phone.slice(4)}`.trim();
}
