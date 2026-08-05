# commit_convention.md — コミットメッセージ規約

## 1. Purpose（目的）

コミット履歴が、将来Claude Codeや別の担当者が変更の経緯を追跡できる「変更履歴の資産」になるよう、メッセージ形式を統一する。

## 2. Scope（対象範囲）

GitHubリポジトリへの全コミットを対象とする。

## 3. コミットメッセージ形式（Conventional Commits準拠）

```
<type>(<scope>): <概要（日本語可）>

<必要であれば詳細説明>
```

## 4. type一覧

| type       | 用途                                         |
| ---------- | -------------------------------------------- |
| `feat`     | 新機能追加（FR-IDに対応する実装）            |
| `fix`      | 不具合修正                                   |
| `refactor` | 挙動を変えないコード整理                     |
| `docs`     | ドキュメントのみの変更（docs/配下）          |
| `style`    | フォーマット・見た目のみの調整（Lint修正等） |
| `test`     | テストの追加・修正                           |
| `chore`    | ビルド設定・依存パッケージ更新等             |

## 5. scopeの例

コンテキスト単位（bounded_context.md）を基本とする：`inventory`, `knowledge`, `crm`, `seo`, `admin`, `db` 等。

## 6. コミットメッセージ例

```
feat(inventory): 車両価格変更時のprice_histories自動追記を実装（FR-INV-006, BR-HIST-001）

fix(seo): Slug変更時にredirectsが作成されない不具合を修正（BR-URL-002）

docs(database): table_definitions.mdにaudit_logsのカラム定義を追加
```

## 7. 運用ルール

- 対応するFR-ID／BR-IDがある変更は、コミットメッセージ内に明記する（トレーサビリティ確保）
- 1コミット1目的を基本とする（複数の無関係な変更を1コミットにまとめない）
- DBスキーマ変更を伴うコミットは、対応するマイグレーションファイルと同一コミットに含める

## 8. Acceptance Criteria（本ドキュメントの受け入れ基準）

- [ ] type一覧が、想定される変更種別を過不足なくカバーしている
- [ ] FR-ID／BR-IDとコミット履歴が紐づけられる規約になっている
- [ ] 将来の担当者がコミット履歴だけで変更の意図を追跡できる形式になっている
