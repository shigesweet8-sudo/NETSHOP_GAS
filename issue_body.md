## 概要
調査の結果、Web入口(doGet)およびHTMLが未実装であることが判明した。
本Issueでは、WAVEシステムのフロントエンド基盤を構築し、API経由でデータを表示する。

## 実装要件
1.  **ルーティング実装 (`10_webapp.gs`)**:
    - `doGet(e)` を実装し、`wave_dashboard.html` を `HtmlService` でレンダリングして返す。
    - X-Frame-Optionsモードを `ALLOWALL` に設定。

2.  **フロントエンド構築 (`wave_dashboard.html` 新規作成)**:
    - Bootstrap 5 (CDN) を導入。
    - **UI構成**: 
        - 上部: 「総売上」「総利益」を表示する3〜4枚のサマリーカード。
        - 下部: 商品一覧を表示するテーブル。
    - **通信ロジック**:
        - `google.script.run` を使用。
        - ページ読み込み時に `api_listItems()` を呼び出し、結果をテーブルに描画。
        - 同時に `api_getDashboardData()` (後述) を呼び出し、カードに値を反映。

3.  **API拡張 (`20_api_netshop.gs`)**:
    - `api_getDashboardData()` を新規実装。
    - 「ダッシュボード」シートから、B列3行目付近にある「総販売数」「総売上」「総利益」等の数値を取得し、JSONオブジェクトで返す。

## 開発ルール（再徹底）
- HTMLからシートを直接操作しない。必ず API ファイルの関数を経由すること。
- 日本語フォント（MS ゴシック等）が適切に表示されるようCSSを調整。
- `CONFIG.SHEET_NAME` 等の既存定数を活用すること。
