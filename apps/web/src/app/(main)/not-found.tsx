// ============================================
// /not-found - 404 page (scope (main) layout only)
// Fix #3.7 - rewrite voi pattern minimal, khong import icon/component
// Server Component, force-dynamic de tranh prerender bug
// ============================================

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-7xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">404</div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Khong tim thay trang
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Trang ban dang tim khong ton tai hoac da bi di chuyen.
      </p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
      >
        Quay ve Dashboard
      </a>
    </div>
  );
}
