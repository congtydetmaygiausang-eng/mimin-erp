chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "MIMIN_OPEN_IMPORT") return;
  chrome.storage.local.set({ miminAiImport: message.payload }, () => {
    chrome.tabs.create({ url: "https://mimin-erp.vercel.app/mang-luoi-san-xuat/tim-kiem#mimin-ai-import" });
    sendResponse({ ok: true });
  });
  return true;
});
