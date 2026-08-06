# table_definitions.md — テーブル定義

## 1. Purpose（目的）

er_diagram.md で定義したテーブル関係を、実際にCREATE TABLE文へ変換できるレベルのカラム定義に落とし込む。型・制約・デフォルト値まで含めて記載し、Claude Codeがそのままマイグレーションファイルを作成できる粒度とする。

## 2. Scope（対象範囲）

er_diagram.mdで定義した全テーブルを対象とする。DB製品はPostgreSQL（Supabase）を前提とする（ADR-001）。

## 3. 共通ルール

- 主キーは全テーブル `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` で統一する
- 全テーブルに `created_at timestamptz NOT NULL DEFAULT now()` / `updated_at timestamptz NOT NULL DEFAULT now()` を付与する（updated_atはトリガーで自動更新）
- 論理削除が必要なテーブルには `deleted_at timestamptz NULL`（NULLでない＝削除済み）を付与する（BR-DEL-001）
- Markdown対応の自由入力カラムは `text` 型とする（BR-CONTENT-001）
- 分類・タグ等のマスタ値は原則マスタテーブル化し、ハードコードのenum型は使用しない（BR-DATA-003）。ただし状態遷移が明確で変更頻度が低いステータス系（後述）は `text` + CHECK制約、または専用のPostgres `enum` 型を用いる

---

## 4. Inventory（在庫）コンテキスト

### 4.1 manufacturers（メーカー）

| カラム     | 型          | 制約             | 説明        |
| ---------- | ----------- | ---------------- | ----------- |
| id         | uuid        | PK               |             |
| name       | text        | NOT NULL, UNIQUE | 例：Jaguar  |
| slug       | text        | NOT NULL, UNIQUE | URL用識別子 |
| deleted_at | timestamptz | NULL可           | 論理削除    |

### 4.2 models（車種）

| カラム          | 型          | 制約                       | 説明        |
| --------------- | ----------- | -------------------------- | ----------- |
| id              | uuid        | PK                         |             |
| manufacturer_id | uuid        | FK→manufacturers, NOT NULL |             |
| name            | text        | NOT NULL                   | 例：Eタイプ |
| slug            | text        | NOT NULL, UNIQUE           |             |
| deleted_at      | timestamptz | NULL可                     |             |

### 4.3 series（シリーズ）

| カラム     | 型          | 制約                | 説明         |
| ---------- | ----------- | ------------------- | ------------ |
| id         | uuid        | PK                  |              |
| model_id   | uuid        | FK→models, NOT NULL |              |
| name       | text        | NOT NULL            | 例：Series 1 |
| slug       | text        | NOT NULL, UNIQUE    |              |
| deleted_at | timestamptz | NULL可              |              |

### 4.4 generations（世代）

| カラム     | 型          | 制約                | 説明       |
| ---------- | ----------- | ------------------- | ---------- |
| id         | uuid        | PK                  |            |
| series_id  | uuid        | FK→series, NOT NULL |            |
| name       | text        | NOT NULL            | 例：前期型 |
| slug       | text        | NOT NULL, UNIQUE    |            |
| deleted_at | timestamptz | NULL可              |            |

### 4.5 grades（グレード）

| カラム        | 型          | 制約                     | 説明        |
| ------------- | ----------- | ------------------------ | ----------- |
| id            | uuid        | PK                       |             |
| generation_id | uuid        | FK→generations, NOT NULL |             |
| name          | text        | NOT NULL                 | 例：4.2 FHC |
| slug          | text        | NOT NULL, UNIQUE         |             |
| deleted_at    | timestamptz | NULL可                   |             |

**注（階層の柔軟性）**：車種によってはシリーズ・世代の区分が存在しない場合がある（05_glossary.md 3章の注記）。その場合は `models` の下に直接 `grades` を作る等、中間階層を1件のダミーではなく**運用上スキップして問題ないよう、`vehicles` テーブル側で各階層IDをすべて独立したNULL許容カラムとして持たせる**（4.6参照）。マスタテーブル自体の親子関係は厳密な階層を保つが、車両がどの粒度まで指定するかは柔軟にする。

### 4.6 vehicles（車両）※コアテーブル

| カラム               | 型          | 制約                                                                        | 説明                                 |
| -------------------- | ----------- | --------------------------------------------------------------------------- | ------------------------------------ |
| id                   | uuid        | PK                                                                          |                                      |
| manufacturer_id      | uuid        | FK→manufacturers, NOT NULL                                                  |                                      |
| model_id             | uuid        | FK→models, NOT NULL                                                         |                                      |
| series_id            | uuid        | FK→series, NULL可                                                           | シリーズ区分がない車種は空           |
| generation_id        | uuid        | FK→generations, NULL可                                                      |                                      |
| grade_id             | uuid        | FK→grades, NULL可                                                           |                                      |
| status               | text        | NOT NULL, CHECK IN ('published','draft','sold','negotiating','coming_soon') | 公開ステータス（05_glossary.md 4章） |
| is_recommended       | boolean     | NOT NULL DEFAULT false                                                      | おすすめフラグ                       |
| is_new_arrival       | boolean     | NOT NULL DEFAULT false                                                      | 新着フラグ                           |
| price                | integer     | NOT NULL                                                                    | 現在価格（円）                       |
| engine               | text        | NULL可                                                                      |                                      |
| engine_model_code    | text        | NULL可                                                                      | エンジン型式                         |
| displacement_cc      | integer     | NULL可                                                                      | 排気量                               |
| horsepower           | integer     | NULL可                                                                      | 馬力                                 |
| torque               | text        | NULL可                                                                      | トルク                               |
| transmission         | text        | NULL可                                                                      | ミッション                           |
| drivetrain           | text        | NULL可                                                                      | 駆動方式                             |
| body_type            | text        | NULL可                                                                      | ボディタイプ                         |
| model_year           | integer     | NULL可                                                                      | 年式                                 |
| registration_year    | integer     | NULL可                                                                      | 登録年                               |
| mileage_km           | integer     | NULL可                                                                      | 走行距離                             |
| shaken_expiry        | date        | NULL可                                                                      | 車検満了日                           |
| owner_count          | integer     | NULL可                                                                      | オーナー数                           |
| indoor_storage       | boolean     | NULL可                                                                      | 屋内保管                             |
| accident_history     | boolean     | NULL可                                                                      | 事故歴                               |
| interior_color       | text        | NULL可                                                                      |                                      |
| exterior_color       | text        | NULL可                                                                      |                                      |
| seat_material        | text        | NULL可                                                                      |                                      |
| vin                  | text        | NULL可, UNIQUE                                                              | 車台番号                             |
| sales_comment        | text        | NULL可                                                                      | Markdown                             |
| manager_comment      | text        | NULL可                                                                      | Markdown（店長コメント）             |
| story                | text        | NULL可                                                                      | Markdown                             |
| sourcing_background  | text        | NULL可                                                                      | Markdown（仕入れ背景）               |
| appeal_points        | text        | NULL可                                                                      | Markdown（この車の魅力）             |
| engine_features      | text        | NULL可                                                                      | Markdown                             |
| common_issues        | text        | NULL可                                                                      | Markdown（よくある故障）             |
| maintenance_cost     | text        | NULL可                                                                      | Markdown（維持費）                   |
| purchase_notes       | text        | NULL可                                                                      | Markdown                             |
| recommended_points   | text        | NULL可                                                                      | Markdown                             |
| maintenance_details  | text        | NULL可                                                                      | Markdown（整備内容）                 |
| custom_details       | text        | NULL可                                                                      | Markdown                             |
| other_notes          | text        | NULL可                                                                      | Markdown                             |
| display_order        | integer     | NOT NULL DEFAULT 0                                                          | 一覧並び替え用                       |
| scheduled_publish_at | timestamptz | NULL可                                                                      | 公開予約日時                         |
| deleted_at           | timestamptz | NULL可                                                                      | 論理削除                             |

### 4.7 grade_templates（グレード別テンプレート）

| カラム                    | 型   | 制約                        | 説明                   |
| ------------------------- | ---- | --------------------------- | ---------------------- |
| id                        | uuid | PK                          |                        |
| grade_id                  | uuid | FK→grades, NOT NULL, UNIQUE | 1グレード1テンプレート |
| engine_features_template  | text | NULL可                      | 自動入力される初期値   |
| common_issues_template    | text | NULL可                      |                        |
| maintenance_cost_template | text | NULL可                      |                        |

### 4.8 vehicle_photos（車両写真）

| カラム        | 型          | 制約                  | 説明                     |
| ------------- | ----------- | --------------------- | ------------------------ |
| id            | uuid        | PK                    |                          |
| vehicle_id    | uuid        | FK→vehicles, NOT NULL |                          |
| storage_path  | text        | NOT NULL              | Supabase Storage上のパス |
| display_order | integer     | NOT NULL DEFAULT 0    |                          |
| deleted_at    | timestamptz | NULL可                |                          |

### 4.9 vehicle_videos（車両動画）

| カラム        | 型      | 制約                  | 説明               |
| ------------- | ------- | --------------------- | ------------------ |
| id            | uuid    | PK                    |                    |
| vehicle_id    | uuid    | FK→vehicles, NOT NULL |                    |
| video_url     | text    | NOT NULL              | YouTube等の外部URL |
| display_order | integer | NOT NULL DEFAULT 0    |                    |

### 4.10 price_histories（価格履歴）※追記専用

| カラム     | 型          | 制約                   | 説明                           |
| ---------- | ----------- | ---------------------- | ------------------------------ |
| id         | uuid        | PK                     |                                |
| vehicle_id | uuid        | FK→vehicles, NOT NULL  |                                |
| old_price  | integer     | NOT NULL               | 変更前価格                     |
| new_price  | integer     | NOT NULL               | 変更後価格                     |
| changed_at | timestamptz | NOT NULL DEFAULT now() |                                |
| changed_by | uuid        | FK→admin_users, NULL可 | 管理者アカウント（認証と連携） |

---

## 5. Knowledge（知識）コンテキスト

### 5.1 encyclopedia_entries（図鑑項目）

| カラム        | 型          | 制約                                                                                              | 説明                 |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------- | -------------------- |
| id            | uuid        | PK                                                                                                |                      |
| category      | text        | NOT NULL, CHECK IN ('brand','series','model','generation','engine','technology','history','term') | 図鑑カテゴリ         |
| parent_id     | uuid        | FK→encyclopedia_entries, NULL可                                                                   | 階層表示用の自己参照 |
| title         | text        | NOT NULL                                                                                          |                      |
| slug          | text        | NOT NULL, UNIQUE                                                                                  |                      |
| body          | text        | NOT NULL                                                                                          | Markdown             |
| display_order | integer     | NOT NULL DEFAULT 0                                                                                |                      |
| deleted_at    | timestamptz | NULL可                                                                                            |                      |

### 5.2 timeline_events（年表イベント）

| カラム         | 型          | 制約                                                                               | 説明                                 |
| -------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| id             | uuid        | PK                                                                                 |                                      |
| event_date     | date        | NOT NULL                                                                           | 日付不明な場合は年始などで代表させる |
| date_precision | text        | NOT NULL, CHECK IN ('year','month','day')                                          | 表示時の丸め粒度                     |
| category       | text        | NOT NULL, CHECK IN ('model_launch','engine_launch','motorsport','history','other') |                                      |
| title          | text        | NOT NULL                                                                           |                                      |
| body           | text        | NULL可                                                                             | Markdown                             |
| deleted_at     | timestamptz | NULL可                                                                             |                                      |

### 5.3 library_entries（ライブラリ項目）

| カラム       | 型          | 制約             | 説明         |
| ------------ | ----------- | ---------------- | ------------ |
| id           | uuid        | PK               |              |
| title        | text        | NOT NULL         |              |
| slug         | text        | NOT NULL, UNIQUE |              |
| reading_kana | text        | NULL可           | 五十音検索用 |
| category     | text        | NULL可           |              |
| body         | text        | NOT NULL         | Markdown     |
| deleted_at   | timestamptz | NULL可           |              |

---

## 6. Content（コンテンツ）コンテキスト

### 6.1 articles（ブログ記事）

| カラム               | 型          | 制約                                     | 説明     |
| -------------------- | ----------- | ---------------------------------------- | -------- |
| id                   | uuid        | PK                                       |          |
| title                | text        | NOT NULL                                 |          |
| slug                 | text        | NOT NULL, UNIQUE                         |          |
| body                 | text        | NOT NULL                                 | Markdown |
| status               | text        | NOT NULL, CHECK IN ('draft','published') |          |
| category             | text        | NULL可                                   |          |
| scheduled_publish_at | timestamptz | NULL可                                   |          |
| published_at         | timestamptz | NULL可                                   |          |
| deleted_at           | timestamptz | NULL可                                   |          |

### 6.2 maintenance_records（整備実績）

| カラム            | 型          | 制約             | 説明                           |
| ----------------- | ----------- | ---------------- | ------------------------------ |
| id                | uuid        | PK               |                                |
| title             | text        | NOT NULL         |                                |
| slug              | text        | NOT NULL, UNIQUE |                                |
| category          | text        | NULL可           | 修理／レストア／整備 等        |
| issue_description | text        | NULL可           | 故障事例                       |
| cost              | integer     | NULL可           | 費用（円）                     |
| body              | text        | NOT NULL         | Markdown（作業内容・ポイント） |
| deleted_at        | timestamptz | NULL可           |                                |

---

## 7. Archive（アーカイブ）コンテキスト

### 7.1 owner_archive_entries（オーナーズアーカイブ）

| カラム              | 型          | 制約                          | 説明                               |
| ------------------- | ----------- | ----------------------------- | ---------------------------------- |
| id                  | uuid        | PK                            |                                    |
| vehicle_id          | uuid        | FK→vehicles, NOT NULL, UNIQUE |                                    |
| restoration_history | text        | NULL可                        | Markdown                           |
| sales_history       | text        | NULL可                        | Markdown                           |
| owner_comment       | text        | NULL可                        | 将来対応：現時点では入力欄のみ用意 |
| is_published        | boolean     | NOT NULL DEFAULT true         |                                    |
| deleted_at          | timestamptz | NULL可                        |                                    |

---

## 8. CRM コンテキスト

### 8.1 customers（顧客）

| カラム       | 型          | 制約     | 説明                               |
| ------------ | ----------- | -------- | ---------------------------------- |
| id           | uuid        | PK       |                                    |
| name         | text        | NOT NULL |                                    |
| phone        | text        | NULL可   |                                    |
| email        | text        | NULL可   |                                    |
| line_user_id | text        | NULL可   | 将来のLINE連携を見据えた予約カラム |
| notes        | text        | NULL可   | 総括メモ                           |
| deleted_at   | timestamptz | NULL可   |                                    |

### 8.2 inquiries（問い合わせ）

| カラム          | 型          | 制約                                                                           | 説明                           |
| --------------- | ----------- | ------------------------------------------------------------------------------ | ------------------------------ |
| id              | uuid        | PK                                                                             |                                |
| customer_id     | uuid        | FK→customers, NULL可                                                           | 未紐付けの初回問い合わせを許容 |
| vehicle_id      | uuid        | FK→vehicles, NULL可                                                            | 車両に関する問い合わせの場合   |
| channel         | text        | NOT NULL, CHECK IN ('line','phone','email','form')                             |                                |
| category        | text        | NOT NULL, CHECK IN ('purchase','repair','sale','parts','other')                |                                |
| message         | text        | NULL可                                                                         |                                |
| response_status | text        | NOT NULL DEFAULT 'unhandled', CHECK IN ('unhandled','in_progress','completed') |                                |
| received_at     | timestamptz | NOT NULL DEFAULT now()                                                         |                                |

### 8.3 customer_notes（顧客メモ）

| カラム      | 型   | 制約                   | 説明 |
| ----------- | ---- | ---------------------- | ---- |
| id          | uuid | PK                     |      |
| customer_id | uuid | FK→customers, NOT NULL |      |
| body        | text | NOT NULL               |      |

### 8.4 reminders（リマインダー）

| カラム       | 型      | 制約                   | 説明                 |
| ------------ | ------- | ---------------------- | -------------------- |
| id           | uuid    | PK                     |                      |
| customer_id  | uuid    | FK→customers, NOT NULL |                      |
| title        | text    | NOT NULL               | 例：車検時期のご連絡 |
| due_date     | date    | NOT NULL               |                      |
| is_completed | boolean | NOT NULL DEFAULT false |                      |

---

## 9. Engagement（ユーザー行動）コンテキスト

### 9.1 favorites（お気に入り）

| カラム      | 型          | 制約                   | 説明                                          |
| ----------- | ----------- | ---------------------- | --------------------------------------------- |
| id          | uuid        | PK                     |                                               |
| vehicle_id  | uuid        | FK→vehicles, NOT NULL  |                                               |
| session_id  | text        | NOT NULL               | 匿名ユーザー識別子（Cookie/localStorage由来） |
| customer_id | uuid        | FK→customers, NULL可   | 問い合わせ発生時に紐付け                      |
| created_at  | timestamptz | NOT NULL DEFAULT now() |                                               |

UNIQUE制約：`(vehicle_id, session_id)` の組み合わせで重複登録を防止

---

## 10. SEO/Meta（横断）コンテキスト

### 10.1 seo_metas（SEOメタ情報）※ポリモーフィック

| カラム          | 型    | 制約                                                                                                                | 説明               |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------ |
| id              | uuid  | PK                                                                                                                  |                    |
| target_type     | text  | NOT NULL, CHECK IN ('vehicle','article','encyclopedia_entry','timeline_event','library_entry','maintenance_record') |                    |
| target_id       | uuid  | NOT NULL                                                                                                            |                    |
| title           | text  | NULL可                                                                                                              |                    |
| description     | text  | NULL可                                                                                                              |                    |
| og_image_url    | text  | NULL可                                                                                                              |                    |
| canonical_url   | text  | NULL可                                                                                                              |                    |
| structured_data | jsonb | NULL可                                                                                                              | Schema.org JSON-LD |
| slug            | text  | NOT NULL, UNIQUE                                                                                                    |                    |

UNIQUE制約：`(target_type, target_id)`

### 10.2 related_contents（関連コンテンツ）※ポリモーフィック

| カラム        | 型      | 制約               | 説明 |
| ------------- | ------- | ------------------ | ---- |
| id            | uuid    | PK                 |      |
| from_type     | text    | NOT NULL           |      |
| from_id       | uuid    | NOT NULL           |      |
| to_type       | text    | NOT NULL           |      |
| to_id         | uuid    | NOT NULL           |      |
| display_order | integer | NOT NULL DEFAULT 0 |      |

### 10.3 redirects（301リダイレクト）

| カラム     | 型          | 制約                   | 説明 |
| ---------- | ----------- | ---------------------- | ---- |
| id         | uuid        | PK                     |      |
| old_path   | text        | NOT NULL, UNIQUE       |      |
| new_path   | text        | NOT NULL               |      |
| created_at | timestamptz | NOT NULL DEFAULT now() |      |

### 10.4 tags（タグマスタ）

| カラム | 型   | 制約             | 説明 |
| ------ | ---- | ---------------- | ---- |
| id     | uuid | PK               |      |
| name   | text | NOT NULL, UNIQUE |      |
| slug   | text | NOT NULL, UNIQUE |      |

### 10.5 taggings（タグ紐付け）※ポリモーフィック

| カラム        | 型   | 制約                                     | 説明 |
| ------------- | ---- | ---------------------------------------- | ---- |
| id            | uuid | PK                                       |      |
| tag_id        | uuid | FK→tags, NOT NULL                        |      |
| taggable_type | text | NOT NULL, CHECK IN ('vehicle','article') |      |
| taggable_id   | uuid | NOT NULL                                 |      |

UNIQUE制約：`(tag_id, taggable_type, taggable_id)`

---

## 11. Audit（監査）コンテキスト

### 11.1 audit_logs（監査ログ）

| カラム        | 型          | 制約                                                                                                  | 説明                                                                     |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| id            | uuid        | PK                                                                                                      |                                                                           |
| actor_type    | text        | NOT NULL DEFAULT 'admin', CHECK IN ('admin','system')                                                   | 操作者種別。管理者操作かCron等のシステム自動操作かを区別する             |
| admin_user_id | uuid        | FK→admin_users, NULL可（actor_type='admin'の場合はNOT NULL、'system'の場合はNULLであることをCHECK制約で保証） |                                                                           |
| target_type   | text        | NOT NULL                                                                                                 | 変更対象のテーブル名                                                     |
| target_id     | uuid        | NOT NULL                                                                                                 |                                                                           |
| action        | text        | NOT NULL, CHECK IN ('create','update','delete','publish','unpublish')                                   |                                                                           |
| changes       | jsonb       | NULL可                                                                                                   | 変更前後の差分                                                           |
| created_at    | timestamptz | NOT NULL DEFAULT now()                                                                                   |                                                                           |

補足（レビュー指摘対応・必須修正3, BR-HIST-002）: Vercel Cron Jobsによる公開予約の自動公開
（app/api/cron/publish-scheduled/route.ts）のように、紐付けられる管理者が存在しないシステム
操作についても監査ログへの記録を省略しない。その際は actor_type = 'system' ・
admin_user_id = null として記録する（マイグレーション:
20260806110000_add_actor_type_to_audit_logs.sql）。

---

## 12. 認証コンテキスト（Supabase Auth連携）

### 12.1 admin_users（管理者アカウント）

Supabase Authのユーザーテーブル（`auth.users`）と1:1で連携する拡張プロフィールテーブル。

| カラム | 型   | 制約                     | 説明                                                       |
| ------ | ---- | ------------------------ | ---------------------------------------------------------- |
| id     | uuid | PK, FK→auth.users.id     |                                                            |
| name   | text | NOT NULL                 |                                                            |
| role   | text | NOT NULL DEFAULT 'admin' | 将来のマルチユーザー対応（FR-ADM-002）を見据えた予約カラム |

## 13. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] er_diagram.md の全テーブルが、カラムレベルまで定義されている
- [ ] 02_functional_requirements.md の車両情報項目（4.2章）・自由入力項目（4.3章）が、vehiclesテーブルのカラムとして過不足なく反映されている
- [ ] BR-DEL-001（論理削除）対象テーブルすべてに `deleted_at` カラムが存在する
- [ ] BR-HIST-001（価格履歴）が `price_histories` テーブルの追記専用設計として反映されている
- [ ] 本ドキュメントの内容が、次工程 `index_strategy.md`・`migration_policy.md` および `docs/api/` にそのまま接続できる粒度である
