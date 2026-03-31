/**
 * Content script — runs in the ISOLATED world of every page.
 *
 * Listens for postMessage events from the MAIN world relay
 * and forwards them to the service worker.
 *
 * Guard: may be re-injected via chrome.scripting.executeScript after
 * extension reload. The guard ensures only one listener is active.
 */

// Remove previous listener if re-injected (avoids duplicate handlers)
if ((window as any).__dcContentHandler) {
  window.removeEventListener('message', (window as any).__dcContentHandler);
}

function dcContentHandler(event: MessageEvent) {
  if (event.source !== window) return;
  if (!event.data?.__dcRelay) return;

  const { action, text, selections } = event.data;
  const senderOrigin = event.origin || window.location.origin;
  console.log('[dc-content] Relay event:', action, text?.slice(0, 50));

  if (action === 'message' && text) {
    chrome.runtime.sendMessage({ type: 'dc-relay-message', text, selections: selections || null }, (response) => {
      console.log('[dc-content] Relay response:', response);
    });
  } else if (action === 'cancel') {
    chrome.runtime.sendMessage({ type: 'dc-relay-cancel' });
  } else if (action === 'toggle-follow') {
    chrome.runtime.sendMessage({ type: 'toggle-follow' }, (response) => {
      console.log('[dc-content] Follow-tabs toggled:', response);
    });
  } else if (action === 'chat-sync') {
    const { chatText, chatRole, chatTime } = event.data;
    chrome.runtime.sendMessage({ type: 'dc-chat-sync', text: chatText, role: chatRole, time: chatTime });
  } else if (action === 'screenshot') {
    const { requestId, opts } = event.data;
    chrome.runtime.sendMessage({ type: 'dc-relay-screenshot', requestId, opts }, (response) => {
      // Send the result back to the MAIN world (use sender's origin, not wildcard)
      window.postMessage({ __dcScreenshotResult: true, requestId, data: response?.data || null }, senderOrigin);
    });
  }
}

(window as any).__dcContentHandler = dcContentHandler;
window.addEventListener('message', dcContentHandler);
console.log('[dc-content] Content script loaded on:', location.href);
