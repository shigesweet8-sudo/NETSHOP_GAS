1. 修正対象の .github/workflows/altana_ai_factory.yml ファイルを開く。
2. "Create Japanese review summary" ステップを見つけて、review_result.json の content を使用して review_summary_ja.txt を生成するように修正する。
3. 必要に応じて、Issue と Changed Files の補助情報を日本語で追加する。
4. 英語固定テンプレを削除し、出力を日本語のレビュー内容に基づくように変更する。
5. review severity 判定に影響を与えないように既存のロジックを維持する。
