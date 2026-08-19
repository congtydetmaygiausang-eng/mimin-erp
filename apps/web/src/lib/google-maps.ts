import { standardizeVietnamAddress } from "@/lib/vietnam-address";

export interface GoogleMapsLocation {
  legalName: string;
  address: string;
  district?: string;
  province?: string;
  latitude?: number | null;
  longitude?: number | null;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(?:tp\s*hcm|tphcm|hcm)\b/g, "thanh pho ho chi minh")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function appendMissing(parts: string[], value: string | undefined): void {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  if (!trimmed) return;
  const combined = normalize(parts.join(", "));
  if (!combined.includes(normalize(trimmed))) parts.push(trimmed);
}

/** Địa chỉ hiển thị/tìm kiếm thống nhất; không dùng tọa độ thay cho địa chỉ có sẵn. */
export function googleMapsAddress(location: GoogleMapsLocation): string {
  const standardized = standardizeVietnamAddress(location.address);
  const parts: string[] = [];
  appendMissing(parts, standardized.currentAddress);
  // Khi địa chỉ đã chuyển sang xã mới, không ghép lại huyện cũ từ cột district.
  if (!standardized.standard) appendMissing(parts, location.district);
  appendMissing(parts, location.province);
  appendMissing(parts, parts.length ? "Việt Nam" : undefined);
  return parts.join(", ");
}

export function googleMapsSearchUrl(location: GoogleMapsLocation): string {
  const address = googleMapsAddress(location);
  const query = address
    ? address
    : location.legalName.trim() || (location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined
      ? `${location.latitude},${location.longitude}`
      : "Việt Nam");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsDirectionsUrl(location: GoogleMapsLocation): string {
  const address = googleMapsAddress(location);
  const destination = address || location.legalName.trim() || (location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined
    ? `${location.latitude},${location.longitude}`
    : "Việt Nam");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
