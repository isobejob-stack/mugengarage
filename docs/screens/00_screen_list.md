# 00_screen_list.md — 画面一覧・画面遷移

## 1. Purpose（目的）

02_functional_requirements.md のFR-IDを、実際にユーザー・運用者が操作する「画面」単位に落とし込む。本ドキュメントは画面設計フェーズ全体の目次であり、各画面の詳細仕様は 01_public_ui_spec.md（公開画面）・02_admin_ui_spec.md（管理画面）で定義する。共通のUIルールは 03_ui_rules.md を参照。

## 2. Scope（対象範囲）

Public Website（公開サイト）とAdmin UI（管理画面）の全画面を対象とする。画面IDは以降のドキュメント・実装（ファイル名・ルーティング）で共通して使用する。

## 3. 画面ID命名規則

`SCR-[PUB|ADM]-[連番]` とする（PUB=公開画面、ADM=管理画面）。

## 4. 公開画面一覧（Public Website）

| 画面ID      | 画面名                     | URL例                        | 対応FR-ID                           |
| ----------- | -------------------------- | ---------------------------- | ----------------------------------- |
| SCR-PUB-001 | トップページ               | `/`                          | FR-INV-005, FR-LINE-001, FR-SEO-001 |
| SCR-PUB-002 | 車両一覧・検索結果         | `/vehicles`                  | FR-SRCH-001〜003, FR-INV-005        |
| SCR-PUB-003 | 車両詳細                   | `/vehicles/:slug`            | FR-VEH-001〜008                     |
| SCR-PUB-004 | お気に入り一覧             | `/favorites`                 | FR-FAV-001, FR-FAV-002              |
| SCR-PUB-005 | 人気ランキング             | `/vehicles/ranking`          | FR-FAV-004                          |
| SCR-PUB-006 | ブログ一覧                 | `/blog`                      | FR-BLOG-001〜005                    |
| SCR-PUB-007 | ブログ詳細                 | `/blog/:slug`                | FR-BLOG-001, FR-BLOG-005            |
| SCR-PUB-008 | Jaguar図鑑トップ／階層一覧 | `/encyclopedia`              | FR-ENC-002                          |
| SCR-PUB-009 | 図鑑詳細                   | `/encyclopedia/:slug`        | FR-ENC-003〜005                     |
| SCR-PUB-010 | Jaguar年表                 | `/timeline`                  | FR-TL-002, FR-TL-003                |
| SCR-PUB-011 | ライブラリ一覧             | `/library`                   | FR-LIB-003                          |
| SCR-PUB-012 | ライブラリ詳細             | `/library/:slug`             | FR-LIB-002                          |
| SCR-PUB-013 | 整備実績一覧               | `/maintenance-records`       | FR-MNT-003                          |
| SCR-PUB-014 | 整備実績詳細               | `/maintenance-records/:slug` | FR-MNT-001〜003                     |
| SCR-PUB-015 | オーナーズアーカイブ一覧   | `/owners-archive`            | FR-OWN-003                          |
| SCR-PUB-016 | オーナーズアーカイブ詳細   | `/owners-archive/:vehicleId` | FR-OWN-001〜003                     |
| SCR-PUB-017 | 問い合わせフォーム         | `/contact`                   | FR-INQ-001                          |
| SCR-PUB-018 | 店舗情報・アクセス         | `/about`                     | — （静的コンテンツ、FR対象外）      |
| SCR-PUB-019 | 404ページ                  | —                            | error_response.md 6章               |

## 5. 管理画面一覧（Admin UI）

| 画面ID      | 画面名                        | URL例                                                                   | 対応FR-ID                                      |
| ----------- | ----------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| SCR-ADM-001 | ログイン                      | `/admin/login`                                                          | authentication.md                              |
| SCR-ADM-002 | ダッシュボード                | `/admin`                                                                | FR-ADM-001（全体サマリ表示）                   |
| SCR-ADM-003 | 車両一覧（管理）              | `/admin/vehicles`                                                       | FR-INV-002, FR-INV-004, FR-INV-005, FR-INV-008 |
| SCR-ADM-004 | 車両登録・編集フォーム        | `/admin/vehicles/new`, `/admin/vehicles/:id/edit`                       | FR-INV-001〜014, FR-VEH-004                    |
| SCR-ADM-005 | 顧客一覧                      | `/admin/customers`                                                      | FR-CRM-001                                     |
| SCR-ADM-006 | 顧客詳細（タイムライン）      | `/admin/customers/:id`                                                  | FR-CRM-002〜005                                |
| SCR-ADM-007 | 問い合わせ一覧                | `/admin/inquiries`                                                      | FR-INQ-002, FR-INQ-004                         |
| SCR-ADM-008 | 問い合わせ詳細                | `/admin/inquiries/:id`                                                  | FR-INQ-002〜004                                |
| SCR-ADM-009 | ブログ記事一覧（管理）        | `/admin/articles`                                                       | FR-BLOG-001, FR-BLOG-003                       |
| SCR-ADM-010 | ブログ記事編集                | `/admin/articles/new`, `/admin/articles/:id/edit`                       | FR-BLOG-001〜005                               |
| SCR-ADM-011 | 図鑑管理一覧                  | `/admin/encyclopedia`                                                   | FR-ENC-001                                     |
| SCR-ADM-012 | 図鑑編集                      | `/admin/encyclopedia/new`, `/admin/encyclopedia/:id/edit`               | FR-ENC-001, FR-ENC-004                         |
| SCR-ADM-013 | 年表管理一覧                  | `/admin/timeline`                                                       | FR-TL-001                                      |
| SCR-ADM-014 | 年表編集                      | `/admin/timeline/new`, `/admin/timeline/:id/edit`                       | FR-TL-001, FR-TL-003                           |
| SCR-ADM-015 | ライブラリ管理一覧            | `/admin/library`                                                        | FR-LIB-001                                     |
| SCR-ADM-016 | ライブラリ編集                | `/admin/library/new`, `/admin/library/:id/edit`                         | FR-LIB-001, FR-LIB-002                         |
| SCR-ADM-017 | 整備実績管理一覧              | `/admin/maintenance-records`                                            | FR-MNT-001                                     |
| SCR-ADM-018 | 整備実績編集                  | `/admin/maintenance-records/new`, `/admin/maintenance-records/:id/edit` | FR-MNT-001〜002                                |
| SCR-ADM-019 | オーナーズアーカイブ管理      | `/admin/owners-archive/:vehicleId/edit`                                 | FR-OWN-002                                     |
| SCR-ADM-020 | SEO設定（共通コンポーネント） | 各編集画面内に埋め込み                                                  | FR-SEO-001〜004                                |
| SCR-ADM-021 | メディア管理                  | `/admin/media`                                                          | FR-ADM-003                                     |
| SCR-ADM-022 | グレード別テンプレート管理    | `/admin/templates`                                                      | FR-ADM-004, FR-VEH-004                         |
| SCR-ADM-023 | 監査ログ                      | `/admin/audit-logs`                                                     | FR-ADM-005                                     |
| SCR-ADM-024 | タグ管理                      | `/admin/tags`                                                           | BR-DATA-003                                    |
| SCR-ADM-025 | リダイレクト一覧              | `/admin/redirects`                                                      | FR-SEO-003                                     |

## 6. 画面遷移（主要フロー）

### 6.1 一般ユーザー：車両を探して問い合わせるまで

```
トップ(SCR-PUB-001)
  → 車両一覧・検索(SCR-PUB-002)
    → 車両詳細(SCR-PUB-003)
      → お気に入り登録 or LINE相談タップ（公式LINEへ遷移）or 問い合わせフォーム(SCR-PUB-017)
```

### 6.2 一般ユーザー：Jaguarについて調べる

```
トップ(SCR-PUB-001)
  → 図鑑(SCR-PUB-008) → 図鑑詳細(SCR-PUB-009) → 関連在庫車両があれば車両詳細(SCR-PUB-003)へ
  → 年表(SCR-PUB-010) → 関連する図鑑・記事へ
  → ライブラリ(SCR-PUB-011) → ライブラリ詳細(SCR-PUB-012)
```

### 6.3 運用者：車両を1台登録して公開する

```
ログイン(SCR-ADM-001)
  → ダッシュボード(SCR-ADM-002)
    → 車両一覧(SCR-ADM-003)
      → 車両登録フォーム(SCR-ADM-004)
        入力：基本情報→自由入力→写真→SEO/タグ→関連紐付け→公開ステータス変更
      → 車両一覧に戻り、一覧上でも状態確認可能
```

### 6.4 運用者：問い合わせに対応する

```
ログイン(SCR-ADM-001)
  → 問い合わせ一覧(SCR-ADM-007)（未対応が一目でわかる表示）
    → 問い合わせ詳細(SCR-ADM-008)
      → 顧客紐付け（新規 or 既存）→ 顧客詳細(SCR-ADM-006)で履歴確認
      → 対応ステータス更新 → 必要に応じてリマインダー設定
```

## 7. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] 02_functional_requirements.md の全FR-IDが、いずれかの画面に紐づいている
- [ ] 公開画面・管理画面の全画面がSCR-IDで一意に識別できる
- [ ] 主要な利用シナリオ（一般ユーザー／運用者）が画面遷移として具体化されている
