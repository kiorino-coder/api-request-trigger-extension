// background service worker: localhost:8081/api/v1/hello へのリクエストを監視し、該当タブへ通知する
console.log('[bg] service worker started');

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    try {
      const url = details.url || '';
      if (!url.startsWith('http://localhost:8081/') || !url.includes('/api/v1/hello')) return;

      const initiator = details.initiator || details.originUrl || '';
      console.log('[bg] detected', { url, initiator, tabId: details.tabId });

      if (details.tabId && details.tabId !== -1) {
        chrome.tabs.sendMessage(details.tabId, { type: 'API_DETECTED', url }, () => {
          if (chrome.runtime.lastError) console.warn('[bg] sendMessage error:', chrome.runtime.lastError.message);
          else console.log('[bg] notified tab', details.tabId);
        });
      } else {
        console.log('[bg] no tabId available, skipping notification');
      }
    } catch (e) {
      console.error('[bg] listener error', e);
    }
  },
  // ここはマッチパターン。厳しすぎるとヒットしないのでワイルドカードで広めに指定
  { urls: ["http://localhost:8081/*"] },
  []
);