// ============================================
// /loading - Loading UI (scope (main) layout)
// Fix #3.7 - rewrite pattern minimal de tranh prerender bug
// Server Component, force-dynamic
// ============================================

export const dynamic = "force-dynamic";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Dang tai du lieu...
      </p>
    </div>
  );
}
