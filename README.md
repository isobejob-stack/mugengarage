# M-GARAGE Platform

クラシックJaguar専門店「エムガレージ」向け、在庫管理・CRM・CMS・ナレッジベースを統合したWebプラットフォーム。
設計の全体像は [docs/requirements/00_project.md](docs/requirements/00_project.md) を参照。

## 技術スタック（[docs/decisions/adr-001-tech-stack.md](docs/decisions/adr-001-tech-stack.md)）

| レイヤー                       | 採用技術                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| フロントエンド                 | Next.js 16（App Router） / TypeScript strict / Tailwind CSS |
| フォーム・バリデーション       | React Hook Form + Zod                                       |
| ホスティング                   | Vercel                                                      |
| データベース・認証・ストレージ | Supabase（PostgreSQL / Supabase Auth / Supabase Storage）   |

## ディレクトリ構成

```
app/(public)/     公開サイト（トップ・車両一覧・図鑑・ブログ 等）
app/admin/        管理画面（/admin/login はログイン、/admin/(protected)/* は認証必須）
lib/{context}/    bounded_context.md のコンテキスト単位（inventory, knowledge, content,
                  archive, crm, engagement, seo, audit, auth）でtypes.ts等を管理
lib/supabase/     Supabaseクライアント（client.ts=ブラウザ, server.ts=Server Component/Route Handler）
lib/api/          error_response.md・pagination.md 準拠の共通APIヘルパー
components/ui/    ステータスバッジ・確認ダイアログ等の共通UIコンポーネント（03_ui_rules.md）
supabase/migrations/ DBスキーマ変更履歴（migration_policy.md 準拠）
docs/             要件定義〜開発ルールの設計書一式
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーし、Supabaseプロジェクトの値を設定する。

```bash
cp .env.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認する。

## その他のコマンド

```bash
npm run build         # 本番ビルド
npm run lint           # ESLint
npm run format          # Prettierで整形
npm run format:check   # Prettierチェックのみ
```

## GitHub・Vercel・Supabase 連携（人間の操作が必要な手順）

`deployment.md` の初期セットアップ手順に対応。以下はコードでは自動化できず、アカウント保有者本人の操作が必要な部分。

1. **GitHub**：このプロジェクト用のリポジトリを作成し、`git remote add origin <URL>` の上でpushする
2. **Supabase**：プロジェクトを作成し、`supabase/migrations/` のSQLを実行してテーブルを作成する（Supabase CLIまたはSQL Editorから）。作成後、Project Settings > API から `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を取得し `.env.local` に設定する
3. **Vercel**：GitHubリポジトリと連携し、Supabaseの環境変数をVercelのProject Settings > Environment Variablesにも設定する
4. **管理者アカウント**：Supabase Authで最初の管理者ユーザーを作成し、`admin_users` テーブルに対応する行を追加する

詳細は [docs/development/deployment.md](docs/development/deployment.md) を参照。

## 既知の未決事項

- [docs/tasks/ISSUE-003](docs/tasks/ISSUE-003-production-domain-and-plan-upgrade.md)：本番公開前にVercel Proプラン移行＋独自ドメイン（`m-garage.com`予定）の取得・設定が必要（VercelのHobbyプランは商用利用不可のため）

解決済みのIssueは[docs/tasks/](docs/tasks/)配下に履歴として残している（[ISSUE-001](docs/tasks/ISSUE-001-missing-functional-requirements.md): 02_functional_requirements.md取得済み、[ISSUE-002](docs/tasks/ISSUE-002-rls-policies-undefined.md): RLS方針決定済み）。
