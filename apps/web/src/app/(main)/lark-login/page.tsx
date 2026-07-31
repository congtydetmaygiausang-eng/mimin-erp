"use client";

import { useEffect } from "react";
import { useSession } from "@/components/session-provider";
import { Shield, ExternalLink, ArrowRight } from "lucide-react";
import { getLarkConfig } from "@/lib/lark";

export default function LarkLoginPage() {
  useEffect(() => {
    // Auto redirect khi user click "Login with Lark"
  }, []);

  const config = getLarkConfig();
  const appId = config?.appId || "cli_aaecf6a9f8f8de13";
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/lark-callback` : "";

  const startOAuth = () => {
    const state = Math.random().toString(36).slice(2, 15);
    sessionStorage.setItem("lark_oauth_state", state);
    const url = `https://open.larksuite.com/open-apis/authen/v1/index?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=`;
    // Scope rỗng = default user scopes (bao gồm base:table:create, etc.)
    window.location.href = url;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-10">
      <div className="card p-8 text-center bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-blue-500/30">
        <Shield className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h1 className="text-2xl font-bold mb-2">🔐 Login với Lark</h1>
        <p className="text-sm opacity-70 mb-6 max-w-md mx-auto">
          User Access Token có quyền admin của user - có thể tạo bảng, columns, records
          mà KHÔNG cần add thêm scope cho App.
        </p>
        <button
          onClick={startOAuth}
          className="btn-primary text-base px-6 py-3 flex items-center gap-2 mx-auto"
        >
          <Shield className="w-5 h-5" />
          Login với Lark để cấp quyền
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] opacity-50 mt-4">
          Sau khi login, Lark sẽ redirect về ERP với access_token.
          <br />
          Token có hiệu lực 2 giờ, auto refresh.
        </p>
      </div>

      <div className="card p-5 bg-amber-500/5 border-amber-500/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-amber-600">⚠️</span> Lưu ý quan trọng
        </h3>
        <ul className="text-xs space-y-1 opacity-80 list-disc list-inside">
          <li>App phải được thêm vào workspace "Giau Ngoc's organization" với quyền đọc/ghi Base</li>
          <li>Sau khi login thành công, ERP sẽ tự động tạo 2 bảng mới + 60+ columns</li>
          <li>User Access Token có scope giống user thật (admin) - rất mạnh nhưng cũng rủi ro nếu lộ</li>
          <li>Token hết hạn sau 2h - tự động refresh khi sử dụng</li>
        </ul>
      </div>

      <div className="card p-5 text-xs space-y-2">
        <div className="font-semibold">📋 Hướng dẫn nhanh:</div>
        <ol className="list-decimal list-inside space-y-1 opacity-80">
          <li>Click nút "Login với Lark" ở trên</li>
          <li>Đăng nhập bằng tài khoản Giau Ngoc của a</li>
          <li>Approve các quyền Lark yêu cầu</li>
          <li>Lark redirect về ERP với access_token</li>
          <li>Em tự động tạo schema + sync data</li>
        </ol>
      </div>
    </div>
  );
}
