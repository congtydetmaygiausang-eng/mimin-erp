/**
 * Password Hash Module (P0-01 fix)
 * SHA-256 với salt "polomimin-mimin-erp-v89"
 * 
 * Pre-computed hashes cho tất cả 26 password variants
 * (19 user + 7 mock user cũ)
 */

const SALT = "polomimin-mimin-erp-v89";

// Hash bằng Web Crypto API (client-side)
export async function hashPassword(password: string): Promise<string> {
  const text = SALT + password + SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// ============ PRE-COMPUTED HASHES (tính trước để seed nhanh) ============
export const PRECOMPUTED_HASHES: Record<string, string> = {
  "123": "1a598a77881c0f6475450d93e0f9b7314a955141391ffaa652ab1629214c6b79",
  "admin123": "082baf62a62001b0ec7c23c91154208d60d24f0468503c335edf2053dce34f11",
  "planner123": "db88dafd4b4e4d81517d9257c546beaf27de892e8bc18293a387ad3bbe799a62",
  "warehouse123": "fed969f5bd5bd94929a30bca3043a6cdd02d9ce9dbf82a214705caf67d035272",
  "sewing123": "a8da9950838626d776063ff63a26eaa441c57a67117257a649361edb34c941e6",
  "qc123": "17c18ad4195b90f33a15fc228bce13a872c551ba83d82ed79f4c7ccd0f639948",
  "finishing123": "8cae766be0805fe0cb3ab6f86799570bd94245aaf39ee7570d910a6e8c686bf5",
  "accountant123": "f70d4b20c5ba07920a9ffbe6b096533dfef0f1057813553645e36ccfcd2a0470",
  "giang123": "2e867228954e77cfacb435fe57e4b488a8657d706846627638ee2e280670a6a2",
  "de123": "c2dbdc9b9092d7c7a6dbc73ebecb717a5cd4c2c7919a07d58a14e1b1b204b538",
  "phu123": "91e015d45404ee072be0eb2f74cf2273e9273e235f5eb47ca3bd09caa697a279",
  "ruong123": "ea31b0eefb3576c1c554d184c1e8840206cc8793a3a6c7950fb3cee15702ae93",
  "khoi123": "fb93d5e3bcba894b814e8af8073075aeb7d947f6c924e15d264646274ce5488d",
  "tuyen123": "9c2438b79a98de5d784ec63f13c611c0f750177755637a70e41c2c9aae92ace1",
  "huynh123": "6a65958ef75e6c164d78e09b66a0071107e0e8527eb35323b7d05d6d7237aafd",
  "thuy123": "998f0e3b916efa42f566aa48c088eb6c94c1388ac363bc28acad27a1b2801e34",
  "anhui123": "db0558eaa792e934321fe78c46cab0d36e02565a0b110f9a4a673484883212f0",
  "nhi123": "09edf1a79a0703cc6cf9187f05c7cd2061db6def1ec380619866d9200021b11c",
  "phuong123": "0782a711c55f264c1d0318f94c51766b209384df1e1e15c3afcf873b540f1688",
  "tim123": "21edb136734141a30965f66cef8e5680045688b014978ff0d73d8dde7049fc53",
  "phien123": "cb24817f8216883696ea3a7620aa93b5dc8ba3afe2a368fe3800b35f407ca7b5",
  "sang123": "ecef8ef59433b30757a75cce63bf4feecb3cdbef9df001d85ff9d66770d011a8",
  "giau123": "4951c7f3aa78714e63af8640b5086097f82a3c22a750a42533eccd85584412cb",
  "thanh123": "adb10859ce565fa2b67d104d19ba826a43c4154f48746f96ad4e74fada318666",
  "huyen123": "e2c0419c4f6e70fefcd4ab9404eaa9e9132e8f313401d2d0b7b4e1692ebaa17e",
  "vy123": "7d8ead538a924ee16181c2e465494ba94bff800cfa4a99ac7b12157c83cbd5d6",
  "hau123": "37e0b769b63bcafda158b9a7439bd211af2b425b077f59cb2dac846d93033484",
};

/**
 * Verify password an toàn - dùng pre-computed hash nếu có
 * Fallback về hash runtime cho password mới
 */
export async function verifyPasswordHash(password: string, storedHash: string): Promise<boolean> {
  // Check pre-computed
  if (PRECOMPUTED_HASHES[password] && PRECOMPUTED_HASHES[password] === storedHash) {
    return true;
  }
  // Fallback: hash runtime
  const newHash = await hashPassword(password);
  return newHash === storedHash;
}
