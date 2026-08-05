# coding_standards.md — コーディング規約

## 1. Purpose（目的）

Claude Codeが実装を行う際に、一貫性のあるコードを書くための規約を定義する。人間のレビュアーが常駐しない前提（00_project.md 8章）のため、規約自体をできる限り機械的に守れる形（Lintツール等）で担保する。

## 2. Scope（対象範囲）

Next.js（ADR-001）上での実装における、言語・構成・命名・エラーハンドリング・環境変数管理を対象とする。

## 3. 使用言語・主要技術

| 項目                 | 採用                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| 言語                 | TypeScript（strict モード有効）                                                                        |
| フレームワーク       | Next.js（App Router）                                                                                  |
| スタイリング         | Tailwind CSS（デザイントークンを一元管理しやすく、非デザイナーでも一貫した見た目を保ちやすいため）     |
| フォーム             | React Hook Form + Zod（バリデーションをスキーマとして一元管理）                                        |
| DBクライアント       | Supabase公式クライアント（`@supabase/supabase-js`）                                                    |
| Markdownレンダリング | 標準的なMarkdownライブラリ（例：`react-markdown`）を使用し、HTMLの直接挿入は行わない（BR-CONTENT-001） |

## 4. ディレクトリ構成の原則

- `app/` 配下はNext.js App Routerの規約に従い、公開ページは `app/(public)/`、管理画面は `app/admin/` 配下に分離する（system_architecture.md 4.1, 4.2）
- コンテキスト単位（bounded_context.md）でロジックを整理する。例：`lib/inventory/`, `lib/knowledge/`, `lib/crm/` のように、ドメインをまたいだ直接参照を避ける
- 共通UIコンポーネントは `components/ui/` に集約し、03_ui_rules.mdで定義した共通コンポーネント（ステータスバッジ、確認ダイアログ等）はここで一元管理する
- データベースアクセス（Supabaseクエリ）はAPI Route層またはServer Actionsに閉じ込め、フロントエンドコンポーネントから直接DBを呼び出さない（責務分離）

## 5. 命名規則

- ファイル名：`kebab-case`（例：`vehicle-detail-page.tsx`）
- コンポーネント名：`PascalCase`（例：`VehicleDetailPage`）
- 変数・関数名：`camelCase`
- DBテーブル・カラム名：`snake_case`（table_definitions.mdの命名に統一。フロントエンド側でcamelCaseに変換する場合は変換層を一箇所に集約する）
- 定数：`UPPER_SNAKE_CASE`

## 6. エラーハンドリングの原則

- APIエンドポイントのエラー形式は必ず error_response.md に統一する
- 業務ルール（BR-ID）違反の検証は、フロントエンドのバリデーションだけでなく、必ずAPI/サーバー側でも行う（フロント側の制御を信用しない）
- try-catchで握りつぶさず、想定外エラーは `INTERNAL_ERROR` としてログに詳細を残し、ユーザーには一般的なメッセージのみ返す（error_response.md 6章）

## 7. コメント・ドキュメンテーション

- 複雑な業務ロジック（価格履歴の追記処理、論理削除、ポリモーフィック関連の解決等）には、対応するBR-ID／FR-IDをコメントとして明記する（例：`// BR-HIST-001: 価格変更時は必ずprice_historiesに追記する`）
- 自明なコードにはコメントを付けない（コード自体を読みやすく書くことを優先する）

## 8. Lint・フォーマット

- ESLint + Prettierを導入し、コミット前に自動フォーマットを適用する
- TypeScriptの型エラー・Lintエラーが残った状態でのコミットを禁止する

## 9. 環境変数管理

- Supabase接続情報（URL・APIキー）等の秘匿情報は `.env.local`（ローカル）／Vercelの環境変数管理画面（本番）で管理し、コードにハードコードしない
- `.env.example` をリポジトリに含め、必要な環境変数の一覧を明示する（将来の引き継ぎ用）

## 10. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] 使用技術・ディレクトリ構成が bounded_context.md のコンテキスト分割と矛盾しない
- [ ] BR-ID/FR-IDとコードの対応関係を追跡できるコメント規約が定義されている
- [ ] 秘匿情報がコードにハードコードされない運用ルールが明記されている
