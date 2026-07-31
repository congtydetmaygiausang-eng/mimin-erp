// Password Policy - Quy tắc mật khẩu mạnh

export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

export type PasswordRequirement = {
  label: string;
  test: (pw: string) => boolean;
  required: boolean;
};

export const REQUIREMENTS: PasswordRequirement[] = [
  { label: "Ít nhất 8 ký tự", test: (pw) => pw.length >= 8, required: true },
  { label: "Có chữ hoa (A-Z)", test: (pw) => /[A-Z]/.test(pw), required: true },
  { label: "Có chữ thường (a-z)", test: (pw) => /[a-z]/.test(pw), required: true },
  { label: "Có chữ số (0-9)", test: (pw) => /[0-9]/.test(pw), required: true },
  { label: "Có ký tự đặc biệt (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw), required: true },
  { label: "Không chứa email", test: (pw: string) => true, required: false },
  { label: "Không phải mật khẩu phổ biến", test: (pw) => !["password", "12345678", "qwerty", "admin123"].includes(pw.toLowerCase()), required: true },
];

export function checkPassword(pw: string, email?: string): {
  valid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  failures: string[];
  passes: string[];
} {
  const failures: string[] = [];
  const passes: string[] = [];

  for (const req of REQUIREMENTS) {
    let ok: boolean = req.test(pw);
    if (req.label === "Không chứa email" && email) {
      const local = email.split("@")[0].toLowerCase();
      ok = !!pw && !pw.toLowerCase().includes(local);
    }
    if (ok) passes.push(req.label);
    else if (req.required) failures.push(req.label);
  }

  const score = Math.min(100, Math.floor((passes.length / REQUIREMENTS.length) * 100));

  let strength: PasswordStrength = "weak";
  if (score >= 90) strength = "very-strong";
  else if (score >= 70) strength = "strong";
  else if (score >= 50) strength = "medium";

  return {
    valid: failures.length === 0,
    strength,
    score,
    failures,
    passes,
  };
}

export function strengthColor(strength: PasswordStrength): string {
  return {
    "weak": "bg-red-500",
    "medium": "bg-amber-500",
    "strong": "bg-emerald-500",
    "very-strong": "bg-gradient-to-r from-emerald-400 to-cyan-500",
  }[strength];
}

export function strengthLabel(strength: PasswordStrength): string {
  return {
    "weak": "Yếu",
    "medium": "Trung bình",
    "strong": "Mạnh",
    "very-strong": "Rất mạnh",
  }[strength];
}
