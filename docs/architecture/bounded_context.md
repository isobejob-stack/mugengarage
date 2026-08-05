# bounded_context.md — 境界づけられたコンテキスト

## 1. Purpose（目的）

domain_model.mdで整理したエンティティ群を、「どこからどこまでを1つの責任単位として開発・変更するか」という単位（コンテキスト）に分割する。コンテキストを明確にすることで、密結合・循環参照を防ぎ（00_project.md 12章の実装禁止事項）、将来の変更・拡張時に影響範囲を予測しやすくする。

## 2. Scope（対象範囲）

domain_model.mdで定義した全エンティティを対象に、コンテキスト単位への分割方針を定義する。実際のディレクトリ構成・API分割は `docs/database/`・`docs/api/` で具体化する。

## 3. コンテキスト一覧

| コンテキスト名                                     | 責務                                     | 主なエンティティ                                                                                    |
| -------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Inventory Context**（在庫コンテキスト）          | 車両そのものの管理（唯一のSSOT）         | Vehicle, VehiclePhoto, VehicleVideo, PriceHistory, Manufacturer〜Grade（階層マスタ）, GradeTemplate |
| **Knowledge Context**（知識コンテキスト）          | 在庫に依存しない情報資産の管理           | EncyclopediaEntry, TimelineEvent, LibraryEntry                                                      |
| **Content Context**（コンテンツコンテキスト）      | 記事・整備実績等の発信コンテンツ管理     | Article, MaintenanceRecord                                                                          |
| **Archive Context**（アーカイブコンテキスト）      | 売約済み車両の資産としての保持           | OwnerArchiveEntry                                                                                   |
| **CRM Context**（顧客管理コンテキスト）            | 顧客・問い合わせ・対応履歴の管理         | Customer, Inquiry, CustomerNote, Reminder                                                           |
| **Engagement Context**（ユーザー行動コンテキスト） | 一般ユーザーの行動データ                 | Favorite                                                                                            |
| **SEO/Meta Context**（SEO・横断コンテキスト）      | 全コンテンツ共通のSEO・関連付け・URL管理 | SEOMeta, RelatedContent, Redirect, Tag                                                              |
| **Audit Context**（監査コンテキスト）              | 変更履歴の記録                           | AuditLog                                                                                            |

## 4. コンテキスト間の関係ルール

| #   | ルール                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inventory Contextは、他のどのコンテキストにも依存しない（Vehicleが唯一のSSOTであるため、参照される側に徹する）                                                                                                                            |
| 2   | Knowledge Context（図鑑／年表／ライブラリ）は、Inventory Contextの存在有無に関わらず単体で成立する（BR-DOM-001〜003）                                                                                                                     |
| 3   | Archive Contextは、Inventory Context（Vehicle）のステータス変化（Sold）をトリガーに生成されるが、Vehicle自体を削除・複製しない                                                                                                            |
| 4   | CRM ContextとInventory Context・Archive Contextの連携は、Favoriteや問い合わせ経由の「参照」であり、CRM側にVehicleの情報を複製しない                                                                                                       |
| 5   | SEO/Meta Contextは、あらゆるコンテンツ種別（Vehicle/Article/EncyclopediaEntry/TimelineEvent/LibraryEntry/MaintenanceRecord）に対して同一の仕組み（共通テーブル＋対象種別）でメタ情報を提供する。コンテンツ種別ごとにSEO実装を重複させない |
| 6   | Audit Contextは全コンテキストの変更操作を横断的に記録するが、記録対象のデータそのものには関与しない（読み取り専用の観測者）                                                                                                               |
| 7   | いずれのコンテキストも、他コンテキストのデータを直接書き換えない。更新は必ずそのデータの所有コンテキストを通して行う                                                                                                                      |

## 5. なぜこの分割にするか（設計意図）

- **Knowledge Context を Inventory Context から独立させる理由**：01_business_requirements.md のビジネスゴール「30年の知識をデジタル資産化する」「在庫に依存しないコンテンツ資産を増やす」を技術的に保証するため。仮に将来在庫が0台になっても、図鑑・年表・ライブラリは影響を受けない構造にする
- **Archive Context を独立させる理由**：売約済み車両は「在庫」ではなく「実績・資産」という性質が異なるため、Inventoryの一覧・検索ロジックに影響を与えずに増え続けられるようにする
- **SEO/Meta Context を横断コンテキストとして独立させる理由**：全コンテンツ種別で共通の仕組みにすることで、SEO関連の実装（Title/Description/構造化データ等）が各コンテキストに重複しない（DRY原則、00_project.md 12章）
- **CRM Context を独立させる理由**：将来的な多店舗展開・担当者追加等の拡張余地を残しつつ、個人情報を扱うため他コンテキストとアクセス制御を分離しやすくする（03_non_functional_requirements.md 9章）

## 6. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] 全コンテキストが、domain_model.mdの全エンティティを過不足なくカバーしている
- [ ] コンテキスト間の依存方向が一方向であり、循環参照が存在しない（00_project.md 12章の実装禁止事項に整合）
- [ ] 各コンテキストの分割理由が、01_business_requirements.md のビジネスゴールと紐付いて説明されている
