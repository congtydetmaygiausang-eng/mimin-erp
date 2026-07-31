"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Shield, Database } from "lucide-react";
import { toast } from "sonner";
import { getLarkConfig } from "@/lib/lark";
import { saveUserAccessToken } from "@/lib/lark-user-token";
import { logAudit } from "@/lib/audit-log";
import { useSession } from "@/components/session-provider";

export default function LarkCallbackPage() {
  const router = useRouter();
  const { user } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xử lý OAuth callback...");

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCallback() {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Lark trả về lỗi: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Không nhận được code từ Lark");
        return;
      }

      const savedState = sessionStorage.getItem("lark_oauth_state");
      if (state && savedState && state !== savedState) {
        setStatus("error");
        setMessage("State mismatch (có thể bị CSRF)");
        return;
      }

      const config = getLarkConfig();
      if (!config) {
        setStatus("error");
        setMessage("Chưa có Lark config - vui lòng vào /lark-settings trước");
        return;
      }

      const redirectUri = `${window.location.origin}/lark-callback`;
      const res = await fetch("https://open.larksuite.com/open-apis/authen/v2/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: config.appId,
          client_secret: config.appSecret,
          redirect_uri: redirectUri,
        }),
      });

      const data = await res.json();
      if (data.code !== 0) {
        setStatus("error");
        setMessage(`Đổi code thất bại: ${data.msg || JSON.stringify(data)}`);
        return;
      }

      saveUserAccessToken(
        data.access_token,
        data.refresh_token,
        data.expires_in || 7200,
        { name: data.name, email: data.email }
      );

      logAudit({
        user,
        action: "login",
        module: "auth" as any,
        description: "Đăng nhập Lark OAuth thành công",
        success: true,
      });

      toast.success("Đã lấy user_access_token!");
      setStatus("success");
      setMessage(`Đã cấp quyền thành công! Token có hiệu lực ${Math.floor((data.expires_in || 7200) / 60)} phút. Tự động setup...`);

      setTimeout(() => router.replace("/lark-auto-setup"), 3000);
    } catch (e: any) {
      setStatus("error");
      setMessage(`Lỗi: ${e.message}`);
    }
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="card p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-xl font-bold mb-2">Đang xử lý...</h2>
            <p className="text-sm opacity-70">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-bold mb-2 text-emerald-700">✅ Thành công!</h2>
            <p className="text-sm opacity-70 mb-4">{message}</p>
            <div className="flex gap-2 justify-center">
              <a href="/lark-auto-setup" className="btn-primary flex items-center gap-1">
                <Database className="w-4 h-4" /> Auto Setup
              </a>
              <a href="/lark-settings" className="btn-secondary">Cài đặt</a>
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2 text-red-700">❌ Lỗi</h2>
            <p className="text-sm opacity-70 mb-4">{message}</p>
            <a href="/lark-settings" className="btn-primary">Về cài đặt</a>
          </>
        )}
      </div>
    </div>
  );
}
