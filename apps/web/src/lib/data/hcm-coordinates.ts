export const HCM_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "quận 1": { lat: 10.7756, lng: 106.7019 },
  "quận 2": { lat: 10.7872, lng: 106.7497 },
  "quận 3": { lat: 10.7843, lng: 106.6816 },
  "quận 4": { lat: 10.7583, lng: 106.7011 },
  "quận 5": { lat: 10.7540, lng: 106.6633 },
  "quận 6": { lat: 10.7480, lng: 106.6343 },
  "quận 7": { lat: 10.7337, lng: 106.7262 },
  "quận 8": { lat: 10.7225, lng: 106.6267 },
  "quận 9": { lat: 10.8293, lng: 106.8123 },
  "quận 10": { lat: 10.7743, lng: 106.6669 },
  "quận 11": { lat: 10.7628, lng: 106.6425 },
  "quận 12": { lat: 10.8671, lng: 106.6413 },
  "quận bình tân": { lat: 10.7653, lng: 106.6033 },
  "quận bình thạnh": { lat: 10.8105, lng: 106.7091 },
  "quận gò vấp": { lat: 10.8386, lng: 106.6659 },
  "quận phú nhuận": { lat: 10.7991, lng: 106.6802 },
  "quận tân bình": { lat: 10.8014, lng: 106.6525 },
  "quận tân phú": { lat: 10.7904, lng: 106.6262 },
  "thành phố thủ đức": { lat: 10.8354, lng: 106.7629 },
  "thủ đức": { lat: 10.8354, lng: 106.7629 },
  "huyện bình chánh": { lat: 10.6865, lng: 106.5683 },
  "huyện cần giờ": { lat: 10.5057, lng: 106.8778 },
  "huyện củ chi": { lat: 11.0066, lng: 106.5029 },
  "huyện hóc môn": { lat: 10.8841, lng: 106.5910 },
  "huyện nhà bè": { lat: 10.6552, lng: 106.7214 },
  "hồ chí minh": { lat: 10.7626, lng: 106.6601 },
  "tphcm": { lat: 10.7626, lng: 106.6601 }
};

export function getStaticCoordinate(locationName: string): { lat: number; lng: number } | null {
  const normalized = locationName.toLowerCase().trim();
  
  for (const [key, coords] of Object.entries(HCM_COORDINATES)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }
  return null;
}
