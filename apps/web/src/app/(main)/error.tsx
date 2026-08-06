"use client";

// ============================================
// /error - Global error boundary (scope (main) layout)
// Fix #3.7 - rewrite pattern minimal de tranh prerender bug
// Required: phai la Client Component theo Next.js 15
// ============================================

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Co loi xay ra
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
        {error.message || "Loi khong xac dinh"}
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Ma loi: <code className="px-1 bg-slate-100 dark:bg-slate-800 rounded">{error.digest}</code>
        </p>
      )}
      <button
        onClick={reset}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
      >
        Thu lai
      </button>
    </div>
  );
}
