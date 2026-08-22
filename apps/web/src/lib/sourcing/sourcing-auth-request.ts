type AuthSession = {
  access_token: string;
  expires_at?: number;
};

export interface SourcingAuthProvider {
  getSession(): Promise<{ data: { session: AuthSession | null } }>;
  refreshSession(): Promise<{ data: { session: AuthSession | null }; error: unknown }>;
}

export type SourcingFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const SESSION_REFRESH_MARGIN_SECONDS = 60;

async function getUsableToken(auth: SourcingAuthProvider): Promise<string | null> {
  const session = (await auth.getSession()).data.session;
  if (!session?.access_token) return null;
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || session.expires_at > now + SESSION_REFRESH_MARGIN_SECONDS) return session.access_token;
  const refreshed = await auth.refreshSession();
  if (refreshed.error) return null;
  return refreshed.data.session?.access_token ?? null;
}

export async function fetchWithSourcingAuth(auth: SourcingAuthProvider, input: RequestInfo | URL, init: RequestInit, fetcher: SourcingFetch = fetch): Promise<Response> {
  const send = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetcher(input, { ...init, headers });
  };
  const token = await getUsableToken(auth);
  if (!token) throw new Error("Phiên đăng nhập đã hết hạn. Anh vui lòng đăng nhập lại.");
  const firstResponse = await send(token);
  if (firstResponse.status !== 401) return firstResponse;
  const refreshed = await auth.refreshSession();
  const retryToken = refreshed.error ? null : refreshed.data.session?.access_token;
  if (!retryToken) throw new Error("Phiên đăng nhập đã hết hạn. Anh vui lòng đăng nhập lại.");
  const retryResponse = await send(retryToken);
  if (retryResponse.status === 401) throw new Error("Tài khoản chưa được cấp quyền tìm kiếm hoặc phiên đăng nhập không hợp lệ.");
  return retryResponse;
}
