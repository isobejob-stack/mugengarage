# FR-ID 実装状況棚卸し（2026-08-06）

## 目的

`docs/requirements/02_functional_requirements.md` の全FR-IDと、実コード（`app/`, `lib/`, `components/`, `supabase/migrations/`）を突き合わせた棚卸し結果。特に「マイグレーション／型定義には存在するが、書き込み・表示ロジックが追いついていない」パターン（FR-CRM-005で発見済みの favorites.customer_id と同型の問題）を重点的に確認した。

凡例：✅ 実装済み ／ 🟡 部分実装 ／ ❌ 未実装

---

## 1. 横断的に見つかった「テーブルはあるが実装が追いついていない」パターン

これらは複数FRにまたがって影響するため、個別FRより先に一覧化する。

| # | 発見内容 | 根拠（ファイル） | 影響するFR-ID |
|---|---|---|---|
| P1 | `vehicle_photos` / `vehicle_videos` テーブルと型定義はあるが、クエリ関数・アップロードUI・APIが一切存在しない | `supabase/migrations/20260805090900_*`, `20260805091000_*`, `lib/inventory/types.ts`（`VehiclePhoto`/`VehicleVideo`定義のみ。`lib/inventory/queries.ts`に読み書き関数なし。`components/inventory/vehicle-form.tsx`に写真・動画欄なし） | FR-INV-009, FR-INV-010, FR-VEH-003, FR-OWN-002（写真部分） |
| P2 | `tags` / `taggings` テーブルと型定義（`lib/seo/types.ts`）はあるが、クエリ関数・UIが一切ない。`app/admin/(protected)/tags/page.tsx` は見出しのみのスタブ | `supabase/migrations/20260805092300_*`, `20260805092400_*`, `app/admin/(protected)/tags/page.tsx`（本文なし） | FR-INV-012, FR-BLOG-002（タグ部分）, FR-SRCH-001（タグ絞り込み） |
| P3 | `vehicles.scheduled_publish_at` / `articles.scheduled_publish_at` はDBカラム・zodスキーマにあるが、フォームに入力欄がなく、かつ指定日時に自動公開する仕組み（cron/バッチ）が存在しない | `lib/inventory/schema.ts:52`, `components/inventory/vehicle-form.tsx`（該当フィールドの`<Field>`が存在しない）, `components/content/article-form.tsx`（同様）, リポジトリ内に`vercel.json`やcron/バッチ実装なし | FR-INV-007, FR-BLOG-004 |
| P4 | `redirects` テーブルはあるが、読み書きロジック・ミドルウェアでの301適用が一切ない。管理画面もスタブ | `supabase/migrations/20260805092700_*`, `app/admin/(protected)/redirects/page.tsx`（本文なし）, `lib/supabase/middleware.ts`（redirectsテーブル参照なし） | FR-SEO-003, event_flow.md 3.7全体 |
| P5 | `seo_metas` は `title/description/og_image_url/canonical_url/structured_data` カラムを持つが、実際に書き込まれるのは車両新規作成時の `slug` のみ。他のフィールドを編集するUIがどのコンテンツ種別にも存在しない | `app/api/admin/vehicles/route.ts:66-70`（slugのみinsert）、他の`app/api/admin/*/route.ts`にseo_metas書き込みなし | FR-INV-011, FR-BLOG-005, FR-ENC-004, FR-SEO-001, FR-SEO-002 |
| P6 | 全エンティティに `deleted_at`（論理削除）カラムがあるが、`app/api/**`全体を検索しても `DELETE` ハンドラが1つも存在しない。管理画面にも削除ボタンがない | `supabase/migrations/*`（`SoftDeletable`前提のテーブル多数）、`app/api`配下でGrep `export async function DELETE` → 0件 | FR-INV-003, FR-BLOG-001（削除部分）, FR-ENC-001（削除部分）, FR-TL-001（削除部分）, FR-LIB-001（削除部分）, FR-MNT-001（削除部分） |
| P7 | `vehicles.display_order` カラム・インデックスはあるが、並び替えUI（ドラッグ&ドロップ）も並び替え専用APIも存在しない。管理画面の車両一覧は読み取り専用 | `app/admin/(protected)/vehicles/page.tsx`（並び替えUIなし）、`app/api/admin/vehicles/**`に並び替え用PATCHなし | FR-INV-008 |
| P8 | `is_recommended` / `is_new_arrival` は管理画面フォームで編集できるが、公開側クエリ（`listPublicVehicles`, `searchPublicVehicles`）がこの2カラムをSELECTしておらず、公開ページのどこにもバッジ表示がない | `lib/inventory/queries.ts:102-104`（SELECT句にis_recommended/is_new_arrivalなし） | FR-INV-005（表示側） |
| P9 | `audit_logs` は書き込み（`recordAuditLog`）が車両・記事・問い合わせ更新等で正しく呼ばれているが、閲覧用の管理画面（`/admin/audit-logs`）は見出しのみのスタブで、一覧取得クエリが存在しない | `lib/audit/log.ts`（書き込みのみ）, `app/admin/(protected)/audit-logs/page.tsx`（本文なし） | FR-ADM-005 |

---

## 2. ドメイン別 FR-ID 状況

### Inventory（在庫管理）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-INV-001 | 車両新規登録 | ✅ | `app/api/admin/vehicles/route.ts` POST、`components/inventory/vehicle-form.tsx` |
| FR-INV-002 | 車両編集 | ✅ | `app/api/admin/vehicles/[id]/route.ts` PATCH |
| FR-INV-003 | 車両削除（論理） | ✅ | 2026-08-06実装。売約済み車両は409で拒否（BR-DEL-003） |
| FR-INV-004 | 公開ステータス変更 | ✅ | フォームのstatus select、PATCHで保存 |
| FR-INV-005 | おすすめ／新着フラグ設定 | 🟡 | 管理側の設定は✅（P8参照）。公開側の表示（一覧強調）が❌ |
| FR-INV-006 | 価格変更・履歴保持 | ✅ | `app/api/admin/vehicles/[id]/route.ts:69-76`（price_histories自動追記） |
| FR-INV-007 | 公開予約 | ✅ | 2026-08-07実装。Vercel Cron（毎時）で自動公開、システム操作として監査ログに記録 |
| FR-INV-008 | 一覧並び替え | ❌ | P7参照 |
| FR-INV-009 | 写真アップロード・管理 | ✅ | 2026-08-06実装。`app/api/admin/vehicles/[id]/photos/**`、`components/inventory/vehicle-media-manager.tsx`。Storageバケット`vehicle-photos`は本番未作成のためユーザーによる手動SQL実行待ち |
| FR-INV-010 | 動画登録 | ✅ | 2026-08-06実装。`app/api/admin/vehicles/[id]/videos/**`（外部URL方式、物理削除） |
| FR-INV-011 | 車両別SEO設定 | ✅ | 2026-08-06実装。slug/Title/Description/OGP/canonical編集可能 |
| FR-INV-012 | 車両別タグ付け | ✅ | 2026-08-06実装 |
| FR-INV-013 | グレード別テンプレート適用 | ✅ | `components/inventory/vehicle-form.tsx:82-96`（未入力項目にのみ自動入力） |
| FR-INV-014 | 関連コンテンツ紐付け | 🟡 | `lib/related/*`基盤は存在するが、`vehicle-form.tsx`に`RelatedContentPicker`が組み込まれておらず、車両側から関連記事／図鑑を選ぶことができない（整備実績・年表・ライブラリ側からは車両を選べる＝一方向） |

### Vehicle Detail Page（車両詳細ページ）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-VEH-001 | 車両基本情報表示 | ✅ | 2026-08-07実装。`app/(public)/vehicles/[slug]/page.tsx`で年式・登録年・走行距離・エンジン・排気量・馬力・トルク・ミッション・駆動方式・外装色・内装色・シート素材・オーナー数・車検満了日・保管状況・事故歴・VINまで、DBに値がある項目をすべて表示（本欄は2026-08-06棚卸し時点の記載が古かったため2026-08-07に訂正） |
| FR-VEH-002 | 自由入力コンテンツ表示 | ✅ | Markdownレンダリング実装済み |
| FR-VEH-003 | 写真ギャラリー表示 | ✅ | 2026-08-06実装。`components/inventory/vehicle-media-gallery.tsx`＋`vehicle-media-lightbox.tsx`（拡大表示付き） |
| FR-VEH-004 | テンプレート自動入力 | ✅ | FR-INV-013と同一実装 |
| FR-VEH-005 | 関連コンテンツ表示 | 🟡 | 車両・記事・図鑑・ライブラリは表示可（`RelatedContentList`）。ただし`RelatedContentType`に`maintenance_record`が含まれておらず（`lib/related/types.ts:3`）、仕様上必須の「関連整備実績」表示が構造的に不可能 |
| FR-VEH-006 | お気に入りボタン表示 | ✅ | `components/engagement/favorite-button.tsx` |
| FR-VEH-007 | LINE相談CTA表示 | ✅ | サイト全体共通ヘッダー・フッターで常設（`components/layout/site-header.tsx`, `site-footer.tsx`） |
| FR-VEH-008 | ステータス表示 | ✅ | `VehicleStatusBadge` |

### Search（検索）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-SRCH-001 | 絞り込み検索 | ✅ | 2026-08-06実装。メーカー・車種・価格帯・年式帯・走行距離・ミッション・屋内保管に加え、シリーズ・世代・グレード・車検残・排気量・馬力・オーナー数上限・内装色・外装色・シート素材・駆動方式を追加（詳細検索セクション）。トルク（自由記述）・燃料（DB列なし）・タグ（P2未着手のため）は対応対象外 |
| FR-SRCH-002 | 検索結果一覧表示 | ✅ | `app/(public)/vehicles/page.tsx` |
| FR-SRCH-003 | 検索条件の保持 | ✅ | URLクエリパラメータで保持 |

### Favorites（お気に入り）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-FAV-001〜004 | 全機能 | ✅ | `lib/engagement/queries.ts`にすべて実装済み。FR-CRM-005連携（`linkFavoritesToCustomer`）も`app/api/inquiries/route.ts`から呼び出し済み（前回セッションで修正済み） |

### CMS / Blog

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-BLOG-001 | 記事作成・編集・削除（論理） | ✅ | 2026-08-06、削除機能実装済み |
| FR-BLOG-002 | カテゴリ・タグ管理 | ✅ | カテゴリ（自由記述1件）・タグ（複数付与、2026-08-06実装）ともに対応済み |
| FR-BLOG-003 | 下書き保存 | ✅ | status="draft" |
| FR-BLOG-004 | 公開予約 | ✅ | 2026-08-07実装 |
| FR-BLOG-005 | 記事別SEO設定 | ✅ | 2026-08-06実装 |

### Jaguar Encyclopedia（図鑑）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-ENC-001 | 作成・編集・削除（論理） | ✅ | 2026-08-06、削除機能実装済み |
| FR-ENC-002 | 階層表示 | ✅ | `lib/knowledge/queries.ts`の親子（parent/children）表示 |
| FR-ENC-003 | 在庫非依存の独立公開 | ✅ | vehicle_idを持たない設計（`lib/knowledge/types.ts`のコメント） |
| FR-ENC-004 | SEO設定 | ✅ | 2026-08-06実装 |
| FR-ENC-005 | 関連在庫車両表示 | ❌ | `app/(public)/encyclopedia/[slug]/page.tsx`に該当ロジックなし。`RelatedContentType`に`encyclopedia_entry`は「to側」候補としてはあるが、図鑑ページ側で在庫車両を自動検索する仕組みが皆無 |

### Timeline（年表）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-TL-001 | 登録・編集・削除（論理） | ✅ | 2026-08-06、削除機能実装済み |
| FR-TL-002 | 時系列表示 | ✅ | `app/(public)/timeline/page.tsx` |
| FR-TL-003 | 関連コンテンツ紐付け | ✅ | `RelatedContentPicker`使用済み |

### Library（ライブラリ）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-LIB-001 | 登録・編集・削除（論理） | ✅ | 2026-08-06、削除機能実装済み |
| FR-LIB-002 | 項目間の相互リンク | ✅ | `RelatedContentPicker`使用済み |
| FR-LIB-003 | 五十音・カテゴリ検索 | ✅ | `app/(public)/library/page.tsx` |

### Maintenance Records（整備実績）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-MNT-001 | 登録・編集・削除（論理） | ✅ | 2026-08-06、削除機能実装済み |
| FR-MNT-002 | 関連コンテンツ紐付け | ✅ | `RelatedContentPicker`使用済み（ただしFR-VEH-005側で車両→整備実績の逆参照ができない、上記参照） |
| FR-MNT-003 | 一覧・詳細ページ公開 | ✅ | `app/(public)/maintenance-records/**` |

### Owners Archive（オーナーズアーカイブ）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-OWN-001 | 販売済み車両の自動アーカイブ | ✅ | `app/api/admin/vehicles/[id]/route.ts:79-81`＋`lib/archive/queries.ts`の`ensureOwnerArchiveEntry` |
| FR-OWN-002 | アーカイブ情報管理 | ✅ | レストア履歴・販売履歴（テキスト）✅。写真は2026-08-06実装済み（`app/(public)/owners-archive/[vehicleId]/page.tsx`にギャラリー組み込み済み） |
| FR-OWN-003 | 一覧・詳細公開 | ✅ | `app/(public)/owners-archive/**` |

### CRM（顧客管理）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-CRM-001 | 顧客登録・編集 | ✅ | `app/admin/(protected)/customers/**`、ただし新規登録は問い合わせ経由のみで、管理画面から手動で顧客を新規追加するUIはない（軽微） |
| FR-CRM-002 | 顧客タイムライン表示 | 🟡 | 問い合わせ・メモ・リマインダーは統合タイムラインで✅。お気に入りは別セクションで表示（実質✅）。「購入履歴」「整備履歴」はDBに顧客⇔車両の購入者紐付け・顧客⇔整備実績の紐付けが存在しないため構造的に❌（要件と現スキーマの間に齟齬があり、事業側判断が必要） |
| FR-CRM-003 | メモ登録 | ✅ | `components/crm/customer-note-form.tsx` |
| FR-CRM-004 | リマインダー設定 | ✅ | 設定・完了トグルは実装済み。ただしダッシュボードに「対応期日が近いリマインダー」の横断一覧がなく、顧客ごとに開いて確認する必要がある（軽微な運用性課題） |
| FR-CRM-005 | 顧客とお気に入りの紐付け | ✅ | 前回セッションで修正済み（`linkFavoritesToCustomer`が問い合わせ確定時に呼ばれる） |

### Inquiry（問い合わせ管理）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-INQ-001 | 問い合わせフォーム | ✅ | `app/(public)/contact/page.tsx` |
| FR-INQ-002 | 一覧・詳細管理 | 🟡 | チャネル別の表示（LINE/電話/メール/フォームのラベル）は✅だが、実際にInquiryを作成できるのは公開フォーム（channel="form"）経由のみで、event_flow.md 3.5「電話・LINE等で連絡が入り、運用者が手動記録する」に対応する管理画面からの手動登録UI・APIが存在しない |
| FR-INQ-003 | 顧客情報との紐付け | ✅ | `app/api/inquiries/route.ts`（既存顧客照合・新規作成） |
| FR-INQ-004 | 対応ステータス管理 | ✅ | `app/api/admin/inquiries/[id]/route.ts` PATCH |

### LINE導線

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-LINE-001 | LINE相談CTA設置 | ✅ | ヘッダー・フッター共通設置 |
| FR-LINE-002 | 相談カテゴリ表示 | ✅ | 2026-08-07実装。6カテゴリのボタングリッド、車両詳細に下部固定CTA。LINE_URLは引き続きプレースホルダーのため実URL確定後に要動作確認（FR-LINE-003） |
| FR-LINE-003 | 公式LINEへの遷移 | 🟡 | 実装は✅だが`lib/site-config.ts:14`の`LINE_URL`が`https://line.me/`のプレースホルダーのまま（`// TODO: 実際の公式LINEアカウントのURLに差し替える`）。実データ待ちで機能未完成 |

### SNS連携

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-SNS-001 | YouTube/Instagramリンク設置 | ❌ | コード上に一切の痕跡なし |
| FR-SNS-002 | 関連投稿の表示 | ❌ | 同上 |

### SEO

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-SEO-001 | 全ページ共通メタ管理 | ✅ | 2026-08-06実装。`generateMetadata`＋seo_metas |
| FR-SEO-002 | 構造化データ出力 | 🟡 | 2026-08-06、車両詳細ページのみ実装（schema.org Car）。他コンテンツ種別は未対応 |
| FR-SEO-003 | 301リダイレクト管理 | ✅ | 2026-08-06実装。ミドルウェアで適用、`/admin/redirects`で一覧確認可 |
| FR-SEO-004 | Slug管理 | ✅ | 2026-08-06実装。6ドメインすべてslug編集可、変更時に自動でredirects登録 |
| FR-SEO-005 | サイトマップ自動生成 | ✅ | 2026-08-06実装。`app/sitemap.ts` |
| FR-SEO-006 | パンくずリスト自動生成 | ❌ | 未着手（図鑑ページのハードコードされた簡易パンくずのみ） |
| FR-SEO-007 | robots.txt管理 | ✅ | 2026-08-06実装。`app/robots.ts` |

### Administration（管理画面共通）

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-ADM-001 | スマホ最適化管理画面 | ✅ | 全フォームで`min-h-11`等タップサイズ確保、レスポンシブクラス使用（`docs/screens/03_ui_rules.md`準拠と推測されるが、実機検証は未実施） |
| FR-ADM-002 | 権限管理 | 🟡 | `admin_users.role`カラムは存在するが、「将来のマルチユーザー拡張を見据えた予約カラム」と明記（`supabase/migrations/20260805090100_*:6`）。単一管理者運用の初期リリースでは仕様通りの想定内挙動であり、追加実装は不要と判断（要件上も将来対応と明記） |
| FR-ADM-003 | 画像・動画メディア管理 | ❌ | `app/admin/(protected)/media/page.tsx`は見出しのみのスタブ。P1（写真アップロード基盤）と表裏一体 |
| FR-ADM-004 | テンプレート管理 | ❌ | `app/admin/(protected)/templates/page.tsx`は見出しのみのスタブ。`grade_templates`テーブルへの読み書きUIが存在せず、現状テンプレートはDBに直接投入する以外に更新手段がない |
| FR-ADM-005 | 監査ログ表示 | ❌ | P9参照 |

### AI補助機能

| FR-ID | 機能 | 状況 | 詳細 |
|---|---|---|---|
| FR-AI-001〜004 | 全機能 | ❌ | コード上に一切の痕跡なし（`FR-AI`でGrepしても0件） |

---

## 3. 集計

- ✅ 実装済み：36
- 🟡 部分実装：22
- ❌ 未実装：22

（FR-ID総数80。ドメイン横断の重複カウントなし）

---

## 4. 次に着手すべき優先度順リスト

優先度の判断軸：①ビジネス価値（車を売る・問い合わせを取るという事業目的への直結度）②他機能への影響範囲（ブロッカーになっているか）③実装コスト。00_project.mdの原則（実現可能性＞保守性＞AIが理解しやすい設計＞運用しやすさ＞デザイン）に従い、「まず動く・売れる」を優先。

### 優先度：高

1. **P1: 車両写真アップロード・表示（FR-INV-009, FR-INV-010, FR-VEH-003, FR-OWN-002）**
   中古車販売サイトで写真がない状態は事業上致命的（車を売るサイトの根幹機能）。Supabase Storageバケット設計、アップロードAPI、`vehicle_photos`/`vehicle_videos`のCRUD、ギャラリーUIが必要。影響範囲が最大で、他の多くのFR（車両詳細ページの完成度、オーナーズアーカイブの写真展示）のブロッカーにもなっている。実装コストは中〜大（ストレージ連携が新規要素）。

2. **P6: 論理削除の実装（FR-INV-003ほか6FR）**
   誤登録データを消せない状態は運用リスクが高い（BR-DEL系ルールにも反する）。DELETEハンドラ＋確認ダイアログ＋一覧からの除外を全コンテンツ種別に横展開する、比較的定型的な実装。影響範囲が広い（6FR）わりにコストは小さく、費用対効果が高い。

3. **P4/P5: SEO設定UIと301リダイレクト（FR-INV-011, FR-BLOG-005, FR-ENC-004, FR-SEO-001, FR-SEO-003, FR-SEO-004）**
   `seo_metas`/`redirects`テーブルは設計済みだが編集UIが皆無。集客型ビジネス（検索流入が来店動線の主要経路）である以上、Title/Description編集ができない状態は機会損失が大きい。特に車両slugが自動生成のみで編集不可な点は、URL変更時のリダイレクト自動生成（event_flow.md 3.7）とセットで設計する必要があり、まとめて着手すべき。

### 優先度：中

4. **P3: 公開予約の完成（FR-INV-007, FR-BLOG-004）**
   フィールドはあるが入力UIと自動反映バッチがない。営業時間外に登録して翌朝公開、といった運用ニーズに直結するが、手動で都度ステータス変更すれば代替可能なため写真・削除・SEOよりは優先度を下げる。Vercel Cron等バッチ実行の仕組み選定が必要。

5. **FR-SRCH-001の拡充（絞り込み条件の追加）**
   現状は主要7項目のみ。クラシックカー購入検討者は年式・走行距離に加え、車検・グレード・色等で絞り込みたいニーズが強いと想定されるため、事業価値は高いが、写真がない状態でいくら検索精度を上げても成約に直結しにくいため、P1より後で良い。

6. **P2: タグ機能（FR-INV-012, FR-BLOG-002）**
   検索・分類の柔軟性向上に寄与するが、代替（カテゴリ・メーカー・車種での絞り込み）が既にあるため緊急度は中。

7. **FR-INV-014 / FR-VEH-005の双方向化** — ✅ 2026-08-06実装済み（車両側から関連記事・図鑑・整備実績を設定可能に。ただし「双方向」は片方向リンクを両側で独立設定する方式であり自動相互反映ではない点に注意）

8. **P9/FR-ADM-005: 監査ログ閲覧画面** — ✅ 2026-08-06実装済み

### 優先度：低（事業判断待ち、または将来対応に近い）

9. **FR-CRM-002の「購入履歴・整備履歴」統合表示**
   現スキーマには顧客⇔購入車両、顧客⇔整備実績の紐付けが存在しない。実装には`vehicles`または`owner_archive_entries`に購入者（customer_id）を持たせる設計変更が必要で、DB設計判断を伴う。**事業責任者エージェントへの相談を推奨**（「顧客ごとの購入・整備履歴をどこまで厳密に管理したいか」は運用フロー次第のため）。

10. **FR-LINE-002（相談カテゴリ表示）／SNS連携（FR-SNS-001〜002）**
    現状の単一LINEボタンでも導線としては機能しており、事業上のクリティカルパスではない。デザイン・コンテンツ運用側の意向次第で優先度が変わるため、**着手順は発注者・事業責任者エージェントの意向を確認してから決めるのが望ましい**。

11. **FR-SEO-002（構造化データ）／FR-SEO-005（サイトマップ）／FR-SEO-006（パンくず）／FR-SEO-007（robots.txt）**
    SEO効果はあるが、Title/Description編集（優先度高の③）が先。これらは実装パターンが定型的（Next.jsの`sitemap.ts`/`robots.ts`規約に沿うだけ）でコストは低いため、③に着手するタイミングでまとめて実装するのが効率的。

12. **FR-ADM-003（メディア管理）／FR-ADM-004（テンプレート管理）**
    メディア管理はP1（写真アップロード基盤）の副産物として自然に一部実現できるため、P1着手時に合わせて設計するのが効率的。テンプレート管理は現状DB直接投入で運用回避可能なため優先度は低い。

13. **FR-AI-001〜004（AI補助機能）**
    要件定義書にも「初期リリースでは最終判断は必ず管理者」と明記されており、他の核となる販売機能（写真・SEO・削除）が未完成な現状では投資対効果が低い。**着手は他の高優先度項目が一通り完了した後で良いか、事業責任者エージェントに確認することを推奨**。

---

## 5. 事業判断が必要な論点（要相談）

- FR-CRM-002「購入履歴・整備履歴」の要件定義時点の想定粒度（DBスキーマ変更を伴うため）
- FR-LINE-002のカテゴリ別導線と、現行の単一LINEボタン運用のどちらを初期リリースの完成形とするか
- AI補助機能（FR-AI）の着手タイミング（他の未実装機能との優先順位）
