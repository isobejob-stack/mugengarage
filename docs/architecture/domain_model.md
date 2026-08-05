# domain_model.md — ドメインモデル

## 1. Purpose（目的）

システムに登場する「データの塊（エンティティ）」と、それらの関係性を整理する。ここではDB設計（テーブル・カラムの詳細）はまだ行わず、「何というデータが存在し、何が何を参照するか」という概念レベルの整理を行う。本ドキュメントが `docs/database/` でのテーブル設計の直接の土台となる。

## 2. Scope（対象範囲）

02_functional_requirements.md の全ドメイン（Inventory〜AI補助機能）に登場する主要エンティティを対象とする。

## 3. ドメイン一覧と主要エンティティ

### 3.1 Inventory（在庫）ドメイン

- **Vehicle（車両）**：車両の中心データ。スペック・自由入力項目・ステータスを保持する唯一の場所（BR-DATA-002）
- **VehiclePhoto（車両写真）**：Vehicleに紐づく写真（複数）
- **VehicleVideo（車両動画）**：Vehicleに紐づく外部動画URL（複数）
- **PriceHistory（価格履歴）**：Vehicleの価格変更履歴（上書き禁止、追記のみ）
- **GradeTemplate（グレード別テンプレート）**：グレードごとの初期入力内容（エンジン説明・故障事例・維持費）

### 3.2 車両階層マスタ（05_glossary.md 3章に対応）

- **Manufacturer（メーカー）**
- **Model（車種）**
- **Series（シリーズ）**
- **Generation（世代）**
- **Grade（グレード）**

これらは階層構造を持つマスタデータであり、Vehicleから参照される（Vehicleがコピーを持たない）。

### 3.3 CMS/Blogドメイン

- **Article（記事）**：ブログ記事本体（Markdown、下書き／公開予約対応）

### 3.4 Jaguar Encyclopedia（図鑑）ドメイン

- **EncyclopediaEntry（図鑑項目）**：ブランド／シリーズ／車種／世代／エンジン／技術／歴史／用語集の各項目。Vehicleに依存しない（BR-DOM-001）

### 3.5 Timeline（年表）ドメイン

- **TimelineEvent（年表イベント）**：ブランド資産としてのイベント。特定車両インスタンスには紐付けない（BR-DOM-003）

### 3.6 Library（ライブラリ）ドメイン

- **LibraryEntry（ライブラリ項目）**：辞典形式の知識項目。販売車両に依存しない（BR-DOM-002）

### 3.7 Maintenance Records（整備実績）ドメイン

- **MaintenanceRecord（整備実績）**：修理・レストア・整備の記録

### 3.8 Owners Archive（オーナーズアーカイブ）ドメイン

- **OwnerArchiveEntry（アーカイブ記録）**：売約済みVehicleに付随する記録（レストア履歴・販売履歴・将来的にオーナーコメント）。Vehicle本体は削除されず、ステータス変更＋本エンティティの追加で表現する（BR-DEL-003）

### 3.9 CRM/Inquiryドメイン

- **Customer（顧客）**：顧客の基本情報
- **Inquiry（問い合わせ）**：チャネル別（LINE／電話／メール／フォーム）の問い合わせ記録。Customerに紐付く
- **CustomerNote（顧客メモ）**：Customerに紐づく自由記述メモ
- **Reminder（リマインダー）**：Customerに紐づく対応リマインダー

### 3.10 Favorites（お気に入り）ドメイン

- **Favorite（お気に入り）**：ユーザー（またはセッション）とVehicleの紐付け

### 3.11 横断的（Cross-Cutting）エンティティ

これらは特定ドメインに属さず、複数ドメインの複数エンティティから共通して参照される。

- **Tag（タグ）**：Vehicle・Article等に自由付与できるマスタデータ（BR-DATA-003によりハードコード禁止）
- **SEOMeta（SEOメタ情報）**：Vehicle／Article／EncyclopediaEntry／TimelineEvent／LibraryEntry／MaintenanceRecordがそれぞれ個別に持つ、Title/Description/OGP/Canonical/Slug/構造化データ（BR-URL-003）
- **RelatedContent（関連コンテンツ紐付け）**：Vehicle⇄Article⇄EncyclopediaEntry⇄MaintenanceRecord間の相互参照（コピーではなく参照のみ、BR-DOM-004）
- **AuditLog（監査ログ）**：管理画面上の主要な変更操作の記録（BR-HIST-002）
- **Redirect（301リダイレクト）**：旧URL→新URLのマッピング（BR-URL-002）

## 4. ドメイン間の関係性（概念図）

```
[Manufacturer]─▶[Model]─▶[Series]─▶[Generation]─▶[Grade]─▶[GradeTemplate]
                                                       │
                                                       │ 参照
                                                       ▼
                                                  [Vehicle]──▶[VehiclePhoto]
                                                     │  │  └▶[VehicleVideo]
                                                     │  └───▶[PriceHistory]
                                                     │
                     ┌───────────────┬──────────────┼───────────────┬─────────────┐
                     ▼               ▼              ▼               ▼             ▼
              [RelatedContent]  [Favorite]   [OwnerArchiveEntry] [Inquiry]     [SEOMeta]
                     │
       ┌─────────────┼─────────────┬──────────────────┐
       ▼             ▼             ▼                  ▼
  [Article]  [EncyclopediaEntry] [TimelineEvent]  [MaintenanceRecord]
                     ▲
                     │（参照のみ、独立して存在可能：BR-DOM-001）
              単体でも公開できる

[Customer]──▶[Inquiry]
    │
    ├──▶[CustomerNote]
    ├──▶[Reminder]
    └──▶[Favorite]（顧客に紐づく場合）
```

## 5. 重要な設計原則の確認（BR-IDとの対応）

| 原則                                     | 対応するエンティティ設計                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| BR-DATA-002（車両情報はVehicleのみ保持） | VehiclePhoto/PriceHistory等はVehicleのIDを参照するのみで、スペック情報を複製しない                      |
| BR-DOM-001〜004（ドメイン独立性）        | EncyclopediaEntry/TimelineEvent/LibraryEntryはVehicleを参照せずとも単体で成立するエンティティとして設計 |
| BR-DEL-003（売約済車両は削除しない）     | VehicleはSold後も削除されず、OwnerArchiveEntryが追加される形で表現                                      |
| BR-HIST-001（価格履歴）                  | PriceHistoryは追記専用（Append Only）。Vehicle.priceの上書きと同時に必ず1レコード追加される             |
| BR-URL-003（SEOメタは個別に持てる）      | SEOMetaは各コンテンツエンティティに対して1:1で紐づく（共通テーブル＋対象種別で管理する設計とする）      |

## 6. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] 02_functional_requirements.md の全FR-IDが、いずれかのエンティティで実現可能な粒度になっている
- [ ] 04_business_rules.md の主要ルール（BR-DATA/BR-DOM/BR-DEL/BR-HIST/BR-URL）がエンティティ設計に矛盾なく反映されている
- [ ] 本ドキュメントの内容が、次工程 `docs/database/er_diagram.md` にそのまま接続できる粒度である
