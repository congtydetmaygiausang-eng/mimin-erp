export interface AccountLinkProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  maNV: string | null;
}

export interface EmployeeLinkProfile {
  maNV: string;
  hoTen: string;
}

export const normalizeEmployeeCode = (value: string | null) => (value || "").trim().toUpperCase();

export function reviewAccountLink(account: AccountLinkProfile, accounts: AccountLinkProfile[], employees: EmployeeLinkProfile[]): string {
  const code = normalizeEmployeeCode(account.maNV);
  if (!code) return "Chưa liên kết";
  if (accounts.filter(item => normalizeEmployeeCode(item.maNV) === code).length > 1) return "Trùng liên kết tài khoản";
  const matches = employees.filter(item => normalizeEmployeeCode(item.maNV) === code);
  if (!matches.length) return "Không tìm thấy hồ sơ";
  if (matches.length > 1) return "Trùng mã nhân viên";
  return "Đã liên kết";
}

export function validateAccountLink(accountId: string, employeeCode: string, accounts: AccountLinkProfile[], employees: EmployeeLinkProfile[]): void {
  if (!accounts.some(account => account.id === accountId)) throw new Error("Tài khoản không còn tồn tại. Vui lòng tải lại.");
  const code = normalizeEmployeeCode(employeeCode);
  if (!code || employees.filter(employee => normalizeEmployeeCode(employee.maNV) === code).length !== 1) {
    throw new Error("Phải chọn một hồ sơ nhân viên có mã duy nhất.");
  }
  if (accounts.some(account => account.id !== accountId && normalizeEmployeeCode(account.maNV) === code)) {
    throw new Error("Nhân viên đã liên kết với tài khoản khác. Hãy kiểm tra liên kết hiện có.");
  }
}
