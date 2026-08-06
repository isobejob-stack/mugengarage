# rest_api.md — REST API仕様

## 1. Purpose（目的）

Public WebsiteとAdmin UIが、Database（table_definitions.md）に対してどのようなAPIエンドポイントを通じてデータをやり取りするかを定義する。02_functional_requirements.md の各FR-IDを実現するために必要なエンドポイントを、ドメインごとに列挙する。

## 2. Scope（対象範囲）

Next.js（ADR-001）上に実装するAPIエンドポイント（Route Handlers）を対象とする。認証方式は authentication.md、エラー形式は error_response.md、一覧系のページネーションは pagination.md を参照。

## 3. 共通事項

- ベースパスは `/api/` とする
- 管理系エンドポイントは `/api/admin/` 配下に集約し、authentication.md のアクセス制御ルールを適用する
- リクエスト／レスポンスはすべてJSON形式とする
- 一覧系（複数件返却）エンドポイントは pagination.md の形式に従う
- エラー時は error_response.md の形式に従う

---

## 4. Inventory / Vehicle（在庫・車両）

| メソッド | パス                                      | 認証 | 対応FR-ID                | 説明                                          |
| -------- | ----------------------------------------- | ---- | ------------------------ | --------------------------------------------- |
| GET      | `/api/vehicles`                           | 不要 | FR-SRCH-001, FR-SRCH-002 | 検索条件付き車両一覧取得（公開中のみ）        |
| GET      | `/api/vehicles/:slug`                     | 不要 | FR-VEH-001〜008          | 車両詳細取得（公開中のみ）                    |
| GET      | `/api/admin/vehicles`                     | 必須 | FR-INV-002, FR-INV-008   | 車両一覧取得（全ステータス、論理削除除く）    |
| GET      | `/api/admin/vehicles/:id`                 | 必須 | FR-INV-002               | 車両詳細取得（管理用）                        |
| POST     | `/api/admin/vehicles`                     | 必須 | FR-INV-001               | 車両新規登録                                  |
| PATCH    | `/api/admin/vehicles/:id`                 | 必須 | FR-INV-002               | 車両情報編集                                  |
| DELETE   | `/api/admin/vehicles/:id`                 | 必須 | FR-INV-003               | 車両論理削除                                  |
| PATCH    | `/api/admin/vehicles/:id/status`          | 必須 | FR-INV-004               | 公開ステータス変更（BR-DEL-003を検証）        |
| PATCH    | `/api/admin/vehicles/:id/price`           | 必須 | FR-INV-006               | 価格変更（price_historiesへの自動追記を伴う） |
| PATCH    | `/api/admin/vehicles/reorder`             | 必須 | FR-INV-008               | 一覧並び替え（display_order一括更新）         |
| POST     | `/api/admin/vehicles/:id/photos`          | 必須 | FR-INV-009               | 写真アップロード                              |
| DELETE   | `/api/admin/vehicles/:id/photos/:photoId` | 必須 | FR-INV-009               | 写真削除                                      |
| PATCH    | `/api/admin/vehicles/:id/photos/reorder`  | 必須 | FR-INV-009               | 写真順序変更                                  |
| POST     | `/api/admin/vehicles/:id/videos`          | 必須 | FR-INV-010               | 動画URL登録                                   |
| GET      | `/api/vehicles/:id/price-history`         | 不要 | FR-INV-006               | 価格履歴取得（値下げ履歴の公開表示用、任意）  |

## 5. Search（検索）

| メソッド | パス                           | 認証 | 対応FR-ID   | 説明                                                       |
| -------- | ------------------------------ | ---- | ----------- | ---------------------------------------------------------- |
| GET      | `/api/vehicles/search-options` | 不要 | FR-SRCH-001 | 検索フォーム用の選択肢（メーカー・車種等のマスタ一覧）取得 |

## 6. Favorites（お気に入り）

| メソッド | パス                             | 認証                   | 対応FR-ID  | 説明                       |
| -------- | -------------------------------- | ---------------------- | ---------- | -------------------------- |
| POST     | `/api/favorites`                 | 不要（session_id必須） | FR-FAV-001 | お気に入り登録             |
| DELETE   | `/api/favorites/:vehicleId`      | 不要（session_id必須） | FR-FAV-001 | お気に入り解除             |
| GET      | `/api/favorites`                 | 不要（session_id必須） | FR-FAV-002 | 自分のお気に入り一覧取得   |
| GET      | `/api/vehicles/ranking`          | 不要                   | FR-FAV-004 | 人気ランキング取得         |
| GET      | `/api/admin/favorites/analytics` | 必須                   | FR-FAV-003 | お気に入り分析（管理画面） |

## 7. CMS / Blog

| メソッド | パス                               | 認証 | 対応FR-ID                | 説明                        |
| -------- | ---------------------------------- | ---- | ------------------------ | --------------------------- |
| GET      | `/api/articles`                    | 不要 | —                        | 公開記事一覧                |
| GET      | `/api/articles/:slug`              | 不要 | —                        | 記事詳細                    |
| GET      | `/api/admin/articles`              | 必須 | FR-BLOG-001              | 記事一覧（下書き含む）      |
| POST     | `/api/admin/articles`              | 必須 | FR-BLOG-001, FR-BLOG-003 | 記事新規作成（下書き/公開） |
| PATCH    | `/api/admin/articles/:id`          | 必須 | FR-BLOG-001              | 記事編集                    |
| DELETE   | `/api/admin/articles/:id`          | 必須 | FR-BLOG-001              | 記事論理削除                |
| PATCH    | `/api/admin/articles/:id/schedule` | 必須 | FR-BLOG-004              | 公開予約設定                |

## 8. Jaguar Encyclopedia（図鑑）

| メソッド | パス                          | 認証 | 対応FR-ID              | 説明                           |
| -------- | ----------------------------- | ---- | ---------------------- | ------------------------------ |
| GET      | `/api/encyclopedia`           | 不要 | FR-ENC-002             | 図鑑一覧（階層構造）           |
| GET      | `/api/encyclopedia/:slug`     | 不要 | FR-ENC-003, FR-ENC-005 | 図鑑詳細（関連在庫車両を含む） |
| GET      | `/api/admin/encyclopedia`     | 必須 | FR-ENC-001             | 管理用一覧                     |
| POST     | `/api/admin/encyclopedia`     | 必須 | FR-ENC-001             | 新規作成                       |
| PATCH    | `/api/admin/encyclopedia/:id` | 必須 | FR-ENC-001             | 編集                           |
| DELETE   | `/api/admin/encyclopedia/:id` | 必須 | FR-ENC-001             | 論理削除                       |

## 9. Timeline（年表）

| メソッド | パス                      | 認証 | 対応FR-ID | 説明               |
| -------- | ------------------------- | ---- | --------- | ------------------ |
| GET      | `/api/timeline`           | 不要 | FR-TL-002 | 時系列イベント一覧 |
| GET      | `/api/admin/timeline`     | 必須 | FR-TL-001 | 管理用一覧         |
| POST     | `/api/admin/timeline`     | 必須 | FR-TL-001 | 新規作成           |
| PATCH    | `/api/admin/timeline/:id` | 必須 | FR-TL-001 | 編集               |
| DELETE   | `/api/admin/timeline/:id` | 必須 | FR-TL-001 | 論理削除           |

## 10. Library（ライブラリ）

| メソッド | パス                     | 認証 | 対応FR-ID  | 説明                                 |
| -------- | ------------------------ | ---- | ---------- | ------------------------------------ |
| GET      | `/api/library`           | 不要 | FR-LIB-003 | 一覧（五十音・カテゴリ絞り込み対応） |
| GET      | `/api/library/:slug`     | 不要 | FR-LIB-002 | 詳細（相互リンク含む）               |
| GET      | `/api/admin/library`     | 必須 | FR-LIB-001 | 管理用一覧                           |
| POST     | `/api/admin/library`     | 必須 | FR-LIB-001 | 新規作成                             |
| PATCH    | `/api/admin/library/:id` | 必須 | FR-LIB-001 | 編集                                 |
| DELETE   | `/api/admin/library/:id` | 必須 | FR-LIB-001 | 論理削除                             |

## 11. Maintenance Records（整備実績）

| メソッド | パス                                 | 認証 | 対応FR-ID              | 説明             |
| -------- | ------------------------------------ | ---- | ---------------------- | ---------------- |
| GET      | `/api/maintenance-records`           | 不要 | FR-MNT-003             | 一覧             |
| GET      | `/api/maintenance-records/:slug`     | 不要 | FR-MNT-003             | 詳細             |
| GET      | `/api/admin/maintenance-records`     | 必須 | FR-MNT-001             | 管理用一覧       |
| POST     | `/api/admin/maintenance-records`     | 必須 | FR-MNT-001             | 新規作成         |
| PATCH    | `/api/admin/maintenance-records/:id` | 必須 | FR-MNT-001, FR-MNT-002 | 編集・関連紐付け |
| DELETE   | `/api/admin/maintenance-records/:id` | 必須 | FR-MNT-001             | 論理削除         |

## 12. Owners Archive（オーナーズアーカイブ）

| メソッド | パス                             | 認証 | 対応FR-ID  | 説明                                             |
| -------- | -------------------------------- | ---- | ---------- | ------------------------------------------------ |
| GET      | `/api/owners-archive`            | 不要 | FR-OWN-003 | 一覧                                             |
| GET      | `/api/owners-archive/:vehicleId` | 不要 | FR-OWN-003 | 詳細                                             |
| POST     | `/api/admin/owners-archive`      | 必須 | FR-OWN-002 | アーカイブ情報登録（売約済ステータス変更と連動） |
| PATCH    | `/api/admin/owners-archive/:id`  | 必須 | FR-OWN-002 | 編集                                             |

## 13. CRM（顧客管理）

| メソッド | パス                                 | 認証 | 対応FR-ID  | 説明                         |
| -------- | ------------------------------------ | ---- | ---------- | ---------------------------- |
| GET      | `/api/admin/customers`               | 必須 | FR-CRM-001 | 顧客一覧                     |
| GET      | `/api/admin/customers/:id`           | 必須 | FR-CRM-002 | 顧客詳細（タイムライン含む） |
| POST     | `/api/admin/customers`               | 必須 | FR-CRM-001 | 顧客新規登録                 |
| PATCH    | `/api/admin/customers/:id`           | 必須 | FR-CRM-001 | 顧客編集                     |
| POST     | `/api/admin/customers/:id/notes`     | 必須 | FR-CRM-003 | メモ追加                     |
| POST     | `/api/admin/customers/:id/reminders` | 必須 | FR-CRM-004 | リマインダー設定             |
| PATCH    | `/api/admin/reminders/:id`           | 必須 | FR-CRM-004 | リマインダー完了・編集       |

## 14. Inquiry（問い合わせ管理）

| メソッド | パス                          | 認証 | 対応FR-ID              | 説明                           |
| -------- | ----------------------------- | ---- | ---------------------- | ------------------------------ |
| POST     | `/api/inquiries`              | 不要 | FR-INQ-001             | 問い合わせフォーム送信（公開） |
| GET      | `/api/admin/inquiries`        | 必須 | FR-INQ-002             | 問い合わせ一覧                 |
| GET      | `/api/admin/inquiries/:id`    | 必須 | FR-INQ-002             | 問い合わせ詳細                 |
| PATCH    | `/api/admin/inquiries/:id`    | 必須 | FR-INQ-003, FR-INQ-004 | 顧客紐付け・対応ステータス更新 |
| POST     | `/api/admin/inquiries/manual` | 必須 | FR-INQ-002             | 電話・LINE等の手動記録         |

## 15. SEO

| メソッド | パス                                   | 認証 | 対応FR-ID              | 説明                                                                 |
| -------- | -------------------------------------- | ---- | ---------------------- | -------------------------------------------------------------------- |
| GET      | `/api/admin/seo/:targetType/:targetId` | 必須 | FR-SEO-001             | 対象のSEOメタ取得                                                    |
| PATCH    | `/api/admin/seo/:targetType/:targetId` | 必須 | FR-SEO-001, FR-SEO-004 | SEOメタ・Slug更新（更新時、旧Slugをredirectsへ自動登録：BR-URL-002） |
| GET      | `/api/admin/redirects`                 | 必須 | FR-SEO-003             | リダイレクト一覧                                                     |
| GET      | `/sitemap.xml`                         | 不要 | FR-SEO-005             | サイトマップ（Next.js標準機能で自動生成）                            |
| GET      | `/robots.txt`                          | 不要 | FR-SEO-007             | クロール制御                                                         |

## 16. Administration（管理画面共通）

| メソッド | パス                            | 認証 | 対応FR-ID  | 説明                         |
| -------- | ------------------------------- | ---- | ---------- | ---------------------------- |
| GET      | `/api/admin/media`              | 必須 | FR-ADM-003 | アップロード済みメディア一覧 |
| POST     | `/api/admin/media`              | 必須 | FR-ADM-003 | メディアアップロード         |
| GET      | `/api/admin/templates`          | 必須 | FR-ADM-004 | グレード別テンプレート一覧   |
| PATCH    | `/api/admin/templates/:gradeId` | 必須 | FR-ADM-004 | テンプレート編集             |
| GET      | `/api/admin/audit-logs`         | 必須 | FR-ADM-005 | 監査ログ一覧                 |
| GET      | `/api/admin/tags`               | 必須 | —          | タグマスタ一覧               |
| POST     | `/api/admin/tags`               | 必須 | —          | タグ新規作成（BR-DATA-003）  |
| DELETE   | `/api/admin/tags/:id`           | 必須 | —          | タグ削除（物理削除、taggingsも連動削除） |
| GET      | `/api/admin/redirects`          | 必須 | FR-SEO-003 | 301リダイレクト一覧          |

## 17. AI補助機能

| メソッド | パス                            | 認証 | 対応FR-ID | 説明                                         |
| -------- | ------------------------------- | ---- | --------- | -------------------------------------------- |
| POST     | `/api/admin/ai/generate-text`   | 必須 | FR-AI-001 | 文章生成支援（提案のみ返却、自動保存しない） |
| POST     | `/api/admin/ai/suggest-tags`    | 必須 | FR-AI-002 | タグ提案                                     |
| POST     | `/api/admin/ai/suggest-seo`     | 必須 | FR-AI-003 | SEO改善案提案                                |
| POST     | `/api/admin/ai/suggest-related` | 必須 | FR-AI-004 | 関連コンテンツ提案                           |

**注**：本セクションのAPIはすべて「提案データの返却」のみを行い、確定・保存操作は別途、対象ドメインの通常の更新API（例：`PATCH /api/admin/vehicles/:id`）を管理者が明示的に呼び出す形とする（BR-AI-001）。

## 18. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] 02_functional_requirements.md の全FR-IDが、いずれかのエンドポイントで実現可能になっている
- [ ] 公開系・管理系エンドポイントの認証要否がauthentication.mdと矛盾なく整理されている
- [ ] 一覧系エンドポイントがpagination.mdの形式に従っている
- [ ] BR-AI-001（AIは提案のみ）がAPI設計レベルでも担保されている（AI提案APIが確定操作を兼ねない）
