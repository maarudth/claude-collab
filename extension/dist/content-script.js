"use strict";
(() => {
  // extension/src/content-script.ts
  if (window.__dcContentHandler) {
    window.removeEventListener("message", window.__dcContentHandler);
  }
  function dcContentHandler(event) {
    if (event.source !== window) return;
    if (!event.data?.__dcRelay) return;
    const { action, text, selections } = event.data;
    const senderOrigin = event.origin || window.location.origin;
    console.log("[dc-content] Relay event:", action, text?.slice(0, 50));
    if (action === "message" && text) {
      chrome.runtime.sendMessage({ type: "dc-relay-message", text, selections: selections || null }, (response) => {
        console.log("[dc-content] Relay response:", response);
      });
    } else if (action === "cancel") {
      chrome.runtime.sendMessage({ type: "dc-relay-cancel" });
    } else if (action === "toggle-follow") {
      chrome.runtime.sendMessage({ type: "toggle-follow" }, (response) => {
        console.log("[dc-content] Follow-tabs toggled:", response);
      });
    } else if (action === "chat-sync") {
      const { chatText, chatRole, chatTime } = event.data;
      chrome.runtime.sendMessage({ type: "dc-chat-sync", text: chatText, role: chatRole, time: chatTime });
    } else if (action === "screenshot") {
      const { requestId, opts } = event.data;
      chrome.runtime.sendMessage({ type: "dc-relay-screenshot", requestId, opts }, (response) => {
        window.postMessage({ __dcScreenshotResult: true, requestId, data: response?.data || null }, senderOrigin);
      });
    }
  }
  window.__dcContentHandler = dcContentHandler;
  window.addEventListener("message", dcContentHandler);
  console.log("[dc-content] Content script loaded on:", location.href);
})();
