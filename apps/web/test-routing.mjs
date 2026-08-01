// Quick test cho agent-routing-rules
// Chạy: node test-routing.mjs

import { routeTask, formatRouteForMavis, ROUTING_EXAMPLES } from './src/lib/agent-routing-rules.ts';

console.log("🧪 Test Agent Routing Rules\n");

let pass = 0;
let fail = 0;

for (const ex of ROUTING_EXAMPLES) {
  const result = routeTask(ex.input);
  const matchedAgent = result.primary?.agentId || "orchestrator";
  const expectedMain = ex.expected.includes("agent-") ? ex.expected : "orchestrator";

  const ok = matchedAgent === expectedMain || ex.expected.includes(matchedAgent);
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} "${ex.input}"`);
  console.log(`   → Expected: ${ex.expected}, Got: ${matchedAgent}`);
  if (!ok) {
    console.log(`   Reasons: ${result.primary?.reasons.join(" | ") || "no match"}`);
    fail++;
  } else {
    pass++;
  }
}

console.log(`\n📊 Result: ${pass}/${pass + fail} pass`);

// Test custom inputs
console.log("\n🔍 Custom test cases:");
const custom = [
  "Mavis bảo AI Kho báo cáo tồn kho rồi giao cho Gemini Tài chính lập Excel chi phí",
  "Làm sao để tăng tốc độ cắt vải?",
  "Hôm nay có bao nhiêu đơn hàng mới từ shop?",
  "Sang đi làm trễ 30 phút, chấm công sao?",
];

for (const q of custom) {
  const r = routeTask(q);
  const msg = formatRouteForMavis(q);
  console.log(`\n📝 "${q}"`);
  console.log(`   ${msg}`);
  if (r.secondary.length > 0) {
    console.log(`   Multi-agent: ${r.secondary.map((s) => s.agentName).join(", ")}`);
  }
}
