export type BusinessIdentityGateInput = {
  legalName: string;
  identityEvidenceCount: number;
  hasTaxCode: boolean;
};

const FORMAL_ENTITY_PATTERN = /\b(?:công\s*ty|cty|tnhh|trách nhiệm hữu hạn|cổ phần|doanh nghiệp tư nhân|dntn|hộ kinh doanh)\b/i;
const OPERATING_BUSINESS_PATTERN = /\b(?:xưởng|nhà máy|cửa hàng|đại lý|nhà cung cấp|supplier|manufacturer|factory|shop)\b/i;

/**
 * Cho phép tạo hồ sơ sơ bộ cho cả pháp nhân và cơ sở kinh doanh có danh tính rõ.
 * Cơ sở dùng tên thương mại phải có ít nhất hai neo nhận diện để tránh biến bài
 * SEO/rao vặt thành hồ sơ công ty. Pháp nhân vẫn cần một neo hoặc mã số thuế.
 */
export function passesBusinessIdentityGate(input: BusinessIdentityGateInput): boolean {
  const formalEntity = FORMAL_ENTITY_PATTERN.test(input.legalName);
  if (formalEntity) return input.hasTaxCode || input.identityEvidenceCount >= 1;

  const operatingBusiness = OPERATING_BUSINESS_PATTERN.test(input.legalName);
  return operatingBusiness && input.identityEvidenceCount >= 2;
}

