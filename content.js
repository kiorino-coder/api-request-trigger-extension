// content script: background からの通知を受け取り、ローカルの end エンドポイントへ通知する
function showToast(text, bg = 'rgba(100,220,100,0.95)') {
  try {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position: 'fixed', right: '12px', bottom: '12px',
      background: bg, color: '#000', padding: '8px 12px', borderRadius: '6px',
      zIndex: 2147483647, boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
    });
    document.documentElement.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  } catch (e) { /* ignore */ }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'API_DETECTED' && msg.url) {
    // API 検出時はローカルのエンドポイントへ GET リクエストを送る
    const endpoint = 'http://localhost:8082/api/v2/end';
    fetch(endpoint, { method: 'GET', mode: 'cors' })
      .then(res => res.text().then(body => ({ status: res.status, body })))
      .then(({ status, body }) => {
        console.log('[content] called end endpoint', status, body);
        showToast('Notified end endpoint');
      })
      .catch(err => {
        console.warn('[content] failed to call end endpoint', err);
        try { alert('Failed to notify end endpoint'); } catch(e) {}
      });
  }
});
