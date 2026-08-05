# migration_policy.md — マイグレーションポリシー

## 1. Purpose（目的）

table_definitions.md で定義したテーブルを、実際にデータベース上へ「どう作成し」「どう変更していくか」のルールを定義する。10年以上の長期運用（00_project.md 12章）を見据え、将来Claude Codeや別の担当AIが引き継いでも安全にスキーマ変更できる運用ルールとする。

## 2. Scope（対象範囲）

Supabase（PostgreSQL）に対するテーブル作成・変更・削除（マイグレーション）の運用ルールを対象とする。実際の環境構築手順（Supabaseプロジェクト作成等）は本ドキュメントの対象外とし、architecture/system_architecture.md を前提とする。

## 3. 基本方針

- スキーマ変更は必ず**マイグレーションファイル（SQLまたはSupabase CLIのマイグレーション機能）として記録**し、Supabase管理画面から直接手動でテーブルを変更する運用は行わない
- マイグレーションファイルは `supabase/migrations/` にGitで管理し、GitHubへのpush履歴がそのままスキーマ変更履歴になるようにする
- 1マイグレーション1目的とする（例：「vehiclesテーブル作成」と「price_historiesテーブル作成」は別ファイルに分ける）
- 本番データが入った後のカラム削除・型変更など、データ損失のリスクがある変更は、必ず事前にバックアップを取得してから実行する

## 4. マイグレーションファイルの命名規則

```
supabase/migrations/YYYYMMDDHHMMSS_短い説明.sql
```

例：

```
20260101090000_create_manufacturers_table.sql
20260101090100_create_models_table.sql
20260101093000_create_vehicles_table.sql
```

日時プレフィックスにより実行順序を保証する（Supabase CLIの標準方式に準拠）。

## 5. 初期構築時のマイグレーション順序

table_definitions.md の外部キー依存関係に従い、以下の順序で作成する（依存される側を先に作る）。

1. `admin_users`（Supabase Auth連携）
2. `manufacturers` → `models` → `series` → `generations` → `grades` → `grade_templates`
3. `vehicles`
4. `vehicle_photos`, `vehicle_videos`, `price_histories`
5. `encyclopedia_entries`, `timeline_events`, `library_entries`
6. `articles`, `maintenance_records`
7. `owner_archive_entries`
8. `customers` → `inquiries`, `customer_notes`, `reminders`
9. `favorites`
10. `tags` → `taggings`
11. `seo_metas`, `related_contents`, `redirects`
12. `audit_logs`

## 6. スキーマ変更時のルール

| 変更の種類         | ルール                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| カラム追加         | NULL許容またはDEFAULT値付きで追加する（既存データを壊さない）                                                                           |
| カラム削除         | 即座に削除せず、まず参照している箇所がないことをコード側で確認してから実行する                                                          |
| カラム名変更       | 「新カラム追加→データ移行→旧カラム削除」の3ステップに分け、1マイグレーションで直接RENAMEしない（Claude Code側の実装漏れ時の事故を防ぐ） |
| テーブル削除       | 本プロジェクトでは想定しない（削除が必要な機能自体が出た場合はADRとして記録し、人間の承認を得る）                                       |
| NOT NULL制約の追加 | 既存データが全件条件を満たすことを確認してから追加する                                                                                  |

## 7. 論理削除・価格履歴・監査ログとの整合

- `deleted_at` カラムはマイグレーションで一度追加したら、後から物理削除ロジックへ変更しない（BR-DEL-001の恒久的な遵守）
- `price_histories` はUPDATE・DELETEを行わない追記専用（INSERT ONLY）運用とする。アプリケーション側だけでなく、可能であればDB側の権限設定でも更新・削除を制限することを検討する
- `audit_logs` も同様に追記専用とする

## 8. バックアップ・ロールバック方針

- Supabaseの自動バックアップ機能（03_non_functional_requirements.md 10章）に加え、大きなマイグレーション実行前は手動でのバックアップ取得を確認する
- マイグレーション適用に失敗した場合は、直前のバックアップへのロールバックを優先し、本番データ上での直接修正は行わない

## 9. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] マイグレーションファイルの命名規則・管理場所（Git管理）が明記されている
- [ ] 初期構築時のテーブル作成順序が、外部キー依存関係と矛盾なく整理されている
- [ ] BR-DEL-001（論理削除）・BR-HIST-001（価格履歴）・BR-HIST-002（監査ログ）を後から覆せない運用ルールになっている
- [ ] 将来Claude Codeや別担当者が引き継いでも、本ドキュメントのルールに従えば安全にスキーマ変更できる
