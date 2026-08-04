// PageSpeed Insights API - check performance
const URL_TARGET = "https://mimin-erp.vercel.app/nhan-su/";
const API = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(URL_TARGET)}&strategy=mobile&category=performance`;

console.log("🔍 Calling PageSpeed Insights API...");
console.log("   URL:", URL_TARGET);

try {
  const res = await fetch(API);
  const data = await res.json();
  const lighthouse = data.lighthouseResult;
  if (!lighthouse) {
    console.log("❌ No lighthouse result");
    console.log("   Error:", data.error?.message || "unknown");
    process.exit(1);
  }

  const perf = lighthouse.categories.performance;
  const audits = lighthouse.audits;
  console.log("\n📊 Performance Score:", Math.round(perf.score * 100));

  console.log("\n📋 Key metrics:");
  for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"]) {
    const a = audits[k];
    if (a) console.log(`  ${a.title.padEnd(30)}: ${a.displayValue} (score: ${Math.round((a.score || 0) * 100)})`);
  }
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
}
