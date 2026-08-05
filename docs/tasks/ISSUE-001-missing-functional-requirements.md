# ISSUE-001: 02_functional_requirements.md が未作成

## 起票日

2026-08-05

## 内容

`docs/requirements/` 配下の各ドキュメントから `02_functional_requirements.md`（機能要件定義書、FR-ID体系の定義元）が繰り返し参照されているが、実際にはリポジトリ内に存在しない。

参照箇所の例：

- `06_acceptance_criteria.md`（要件定義フェーズの受け入れ基準チェックリスト対象ファイルとして明記）
- `docs/architecture/domain_model.md`「02_functional_requirements.md の全ドメインに登場する主要エンティティを対象とする」
- `docs/database/er_diagram.md`「02_functional_requirements.md の全FR-IDが、いずれかのテーブルとして表現されている」
- `docs/api/rest_api.md` の全エンドポイント（対応FR-ID列でFR-INV-xxx, FR-VEH-xxx, FR-SRCH-xxx 等を多数参照）
- `docs/screens/00_screen_list.md` の全画面（対応FR-ID列）

## 影響

FR-IDそのものの正式な定義（各機能の詳細な受け入れ条件・入出力仕様）が文書化されていないまま、後続工程（database/api/screens）がFR-IDを前提に書かれている状態。実装時にFR-IDの詳細粒度の仕様が必要になった場合、他ドキュメント（01_business_requirements.md, table_definitions.md, rest_api.md, 画面仕様等）から機能要件を逆引き・再構成する必要がある。

## 方針（BR-SCOPE-003：推測による仕様追加の禁止）

- 現時点ではdatabase/api/screens各ドキュメントの記載が十分具体的であるため、雛形実装（Next.jsプロジェクトのスケルトン作成）を進める上でのブロッカーにはしない
- ただし、各FR-IDの正式な受け入れ基準・詳細仕様が必要になった際は、推測で実装せず、本Issueを参照した上で発注者に02_functional_requirements.mdの所在確認、または新規作成を依頼すること
- 実装対象のFR-IDに疑義が生じた場合は、01_business_requirements.md 4章（ビジネス機能要件）・各database/api/screensドキュメントの記述を一次情報として扱う

## ステータス

未解決（人間の判断待ち）
