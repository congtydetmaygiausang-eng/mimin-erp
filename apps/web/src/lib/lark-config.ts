// Unified Lark config - gộp 9 keys thành 1
// Keys cũ: mimin_lark_config_v1, mimin_lark_user_token_v1, mimin_lark_mock_data_v1,
//          mimin_lark_new_base, mimin_lark_sheet_import, mimin_lark_last_sync,
//          mimin_lark_pushed, mimin_lark_sync_state_v1, mimin_lark_sync_poll

const UNIFIED_KEY = "mimin_lark_unified_v1";

export interface LarkUnifiedConfig {
  appId: string;
  appSecret: string;
  userToken?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  baseId?: string;
  sheetUrl?: string;
  mockData?: any[];
  syncState?: {
    lastSync: string;
    isPolling: boolean;
    pushedIds: string[];
    history: any[];
  };
}

function fromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return defaultValue;
}
function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

const LEGACY_KEYS = [
  "mimin_lark_config_v1", "mimin_lark_user_token_v1", "mimin_lark_mock_data_v1",
  "mimin_lark_new_base", "mimin_lark_sheet_import", "mimin_lark_last_sync",
  "mimin_lark_pushed", "mimin_lark_sync_state_v1", "mimin_lark_sync_poll",
];

let migrated = false;
export function migrateLarkConfig(): LarkUnifiedConfig {
  if (typeof window === "undefined") {
    return { appId: "", appSecret: "" };
  }
  let config = fromStorage<LarkUnifiedConfig>(UNIFIED_KEY, { appId: "", appSecret: "" });
  if (migrated) return config;
  // Migrate từ 9 keys cũ
  for (const key of LEGACY_KEYS) {
    const old = localStorage.getItem(key);
    if (old) {
      try {
        const data = JSON.parse(old);
        // Map sang unified
        if (key === "mimin_lark_config_v1" && data.appId) {
          config = { ...config, appId: data.appId, appSecret: data.appSecret };
        } else if (key === "mimin_lark_user_token_v1" && data.accessToken) {
          config.userToken = data;
        } else if (key === "mimin_lark_new_base" && data.baseId) {
          config.baseId = data.baseId;
        } else if (key === "mimin_lark_sheet_import" && data.sheetUrl) {
          config.sheetUrl = data.sheetUrl;
        } else if (key === "mimin_lark_mock_data_v1") {
          config.mockData = data;
        } else if (key === "mimin_lark_sync_state_v1" || key === "mimin_lark_last_sync" || key === "mimin_lark_pushed" || key === "mimin_lark_sync_poll") {
          config.syncState = {
            ...config.syncState,
            lastSync: data.lastSync || new Date().toISOString(),
            isPolling: data.isPolling || false,
            pushedIds: data.pushedIds || [],
            history: data.history || [],
          } as any;
        }
        // Xóa key cũ
        localStorage.removeItem(key);
      } catch {}
    }
  }
  saveStorage(UNIFIED_KEY, config);
  migrated = true;
  return config;
}

export function getLarkUnifiedConfig(): LarkUnifiedConfig {
  return migrateLarkConfig();
}

export function updateLarkUnifiedConfig(updates: Partial<LarkUnifiedConfig>): LarkUnifiedConfig {
  const current = getLarkUnifiedConfig();
  const updated = { ...current, ...updates };
  saveStorage(UNIFIED_KEY, updated);
  return updated;
}
