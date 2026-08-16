(() => {
  const APP_HOST = "mimin-erp.vercel.app";
  const providers = { "chatgpt.com": "CHATGPT", "gemini.google.com": "GEMINI", "chat.deepseek.com": "DEEPSEEK" };

  if (location.hostname === APP_HOST) {
    if (location.hash !== "#mimin-ai-import") return;
    chrome.storage.local.get("miminAiImport", ({ miminAiImport }) => {
      if (!miminAiImport) return;
      let attempts = 0;
      const deliver = () => {
        attempts += 1;
        window.postMessage({ type: "MIMIN_AI_IMPORT", payload: miminAiImport }, location.origin);
        if (attempts >= 15) clearInterval(timer);
      };
      const timer = setInterval(deliver, 1000);
      window.addEventListener("message", (event) => {
        if (event.origin !== location.origin || event.data?.type !== "MIMIN_AI_IMPORT_RECEIVED") return;
        clearInterval(timer);
        chrome.storage.local.remove("miminAiImport");
        history.replaceState(null, "", location.pathname + location.search);
      }, { once: true });
      deliver();
    });
    return;
  }

  const provider = providers[location.hostname];
  if (!provider || document.getElementById("mimin-ai-sourcing-button")) return;
  const button = document.createElement("button");
  button.id = "mimin-ai-sourcing-button";
  button.textContent = "Gửi sang MIMIN";
  Object.assign(button.style, { position: "fixed", right: "18px", bottom: "84px", zIndex: "2147483647",
    border: "0", borderRadius: "12px", padding: "11px 16px", background: "#0f766e", color: "white",
    font: "600 14px system-ui", boxShadow: "0 8px 24px rgba(0,0,0,.25)", cursor: "pointer" });
  button.title = "Bôi chọn khối JSON trong câu trả lời AI, rồi nhấn nút này";
  button.addEventListener("click", () => {
    const text = window.getSelection()?.toString().trim();
    if (!text) { alert("Anh hãy bôi chọn khối JSON chứa danh sách đối tác trước khi gửi sang MIMIN."); return; }
    if (text.length > 500000) { alert("Nội dung vượt giới hạn 500 KB."); return; }
    chrome.runtime.sendMessage({ type: "MIMIN_OPEN_IMPORT", payload: {
      text, provider, sourceUrl: location.href, capturedAt: new Date().toISOString()
    }});
  });
  document.documentElement.appendChild(button);
})();
