# api-request-trigger-extension

このリポジトリは、特定のページやリクエストをトリガーに動作する簡単なブラウザ拡張（Manifest V3）サンプルです。

現在の実装はシンプルな `content script` で、ページ読み込み時にアラートを出す動作を行います（開発用の最小構成）。

## 概要

- 名前: Hello World Extension（`manifest.json` 内の `name` を参照）
- バージョン: 0.0
- 実装: `content.js`（ページ上で `alert` を表示）
- マッチ対象: `manifest.json` の `content_scripts.matches` に指定された URL（デフォルトは `https://example.com/`）

## 機能

- ページ読み込み時に `Hello, world!, Here is <pageUrl>` のアラートを表示します。

（注）このリポジトリ名は `api-request-trigger-extension` ですが、現状は Hello World サンプルです。将来的に「API リクエストをトリガーに動く機能」を追加する土台として使えます。

## 動作確認（開発環境での手順）

1. Chrome / Edge を開きます。
2. 拡張機能ページを開きます（chrome://extensions/ または edge://extensions/）。
3. 右上で「デベロッパーモード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」または「アンパックされた拡張機能を読み込む」を選び、リポジトリのルートフォルダ（このプロジェクトのフォルダ）を指定します。
5. マッチパターンに合うページ（デフォルトは https://example.com/）を開くと、`content.js` のアラートが表示されます。

## 使い方 / カスタマイズ

- 対象ページを変更するには: `manifest.json` の `content_scripts.matches` を編集してください。
- 表示の振る舞いを変更するには: `content.js` を編集します。現在は単純に alert を出しますが、DOM 操作やページ上のイベント監視、Fetch/XHR のフックなどに変更できます。

API リクエストをトリガーに拡張機能を作りたい場合の選択肢（簡単な案）:

- content script 側で `window.fetch` をラップしたり、`XMLHttpRequest` の prototype を書き換えてリクエストを検知する。
- より正確にネットワークリクエストを監視したい場合は、Manifest V3 の `declarativeNetRequest` や、拡張機能のサービスワーカー（background service worker）と適切な権限を組み合わせる方法があります。ホスト権限や `declarativeNetRequest` のルールを追加する必要があります。

簡単な content-script 偵察例（参考、`content.js` に置く）:

```javascript
// fetch をラップして特定の API を検知するサンプル
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  const url = (typeof input === 'string') ? input : input.url;
  if (url.includes('/api/target')) {
    // ここでメッセージ送信や処理を起動
    console.log('target API called:', url);
  }
  return originalFetch.apply(this, arguments);
};
```

（上記はあくまで一例です。サイトによっては CSP やバンドル済みスクリプトの影響で動作しない場合があります。）

## 開発・デバッグ

- ブラウザの拡張機能ページでソースを確認できます。content script のログは、対象ページの DevTools コンソールに出力されます。
- manifest やスクリプトを変更したら、拡張を再読み込みしてください。

## ファイル構成

- `manifest.json` - 拡張機能の設定（Manifest V3）
- `content.js` - 現在のコンテンツスクリプト（ページでアラートを出す）
- `README.md` - このファイル
- `icons/` - アイコンファイル（`ng_icon_128.ico` など）

## 今後の拡張案

- `background`（service worker）を使ったリクエスト監視と処理の分離
- `declarativeNetRequest` でルールを設定してネットワークリクエストを監視
- オプションページ・ポップアップ UI の追加

## ライセンス

特に記載がない場合はプロジェクト所有者のポリシーに従ってください。必要であれば LICENSE ファイルを追加してください。

---

必要なら、この README を英語版に翻訳したり、`content.js` を API トリガー用の実装に書き換えるパッチを作成します。どの機能を優先したいか教えてください。
# api-request-trigger-extension
特定のAPIリクエストをトリガーにして動くextension
