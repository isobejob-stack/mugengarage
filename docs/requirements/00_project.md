# 00_project.md — プロジェクト概要

## 1. Purpose（目的）

本プロジェクトは、クラシックJaguar専門店「エムガレージ」向けに、単なるコーポレートサイトではなく、**在庫管理・CRM・CMS・ナレッジベースを統合したWebプラットフォーム**を構築することを目的とする。

開発はAI（Claude Code）による実装を前提とし、以降作成するすべてのドキュメントは「読み物」ではなく、Claude Codeがそのまま設計・実装に着手できる「実装仕様書」として作成する。曖昧な記述・推測による仕様追加は禁止し、不足があればIssueとして記録する。

## 2. プロジェクト名

**M-GARAGE Platform**

## 3. 対象店舗情報

| 項目       | 内容                                           |
| ---------- | ---------------------------------------------- |
| 店舗名     | エムガレージ                                   |
| 業態       | クラシックJaguar専門店                         |
| 実績       | 30年以上                                       |
| 事業内容   | 販売・整備・修理・買取・相談                   |
| 参考ページ | https://www.kurumaerabi.com/shop/detail/14921/ |

## 4. プロダクトゴール

1. クラシックJaguarの魅力を伝える
2. 日本一のJaguar専門サイトになる
3. 30年以上蓄積した知識をデジタル資産として保存する
4. 在庫販売を強化する
5. Jaguarの購入・修理・売却・維持まで相談できるブランドになる
6. LINE相談を増やす（サイト全体で最重要CTA）
7. Google検索から継続的に流入を獲得する（SEO最重視）
8. Jaguar好きが何度も訪れるサイトにする

## 5. ターゲットユーザー

**メイン**：クラシックJaguar購入検討者（40〜70代中心）

**サブ**：

- Jaguarオーナー
- 英国車好き
- クラシックカー好き
- これからJaguarを知る若い世代

## 6. 優先順位（このプロジェクトで最重要視すること）

デザインより先に、堅牢なシステムを作ることを最優先する。

1. 実現可能性
2. 保守性
3. AIが理解しやすい設計
4. 運用しやすさ
5. デザイン

## 7. 開発方針

- スマホファースト
- iPhoneで管理できること
- ノーコードで運用できること（管理者はコードを書かない）
- サーバー管理負荷を極力減らす
- SEOを非常に重視する
- 表示速度を重視する
- 長期運用（10年以上）を想定する
- アクセシビリティ対応（高齢ユーザーが多いため、文字・ボタンは大きめ、視認性重視）

## 8. 運用体制の前提

- 管理者：55歳、非エンジニア、スマホ利用中心、毎日利用
- コードを書かない運用が前提のため、管理画面はノーコードかつ学習コストを最小化すること

## 9. システム構成（主要ドメイン）

- Public Website（公開サイト）
- Inventory（在庫管理）
- CRM（顧客管理・問い合わせ管理）
- Blog CMS
- Jaguar Library（図鑑・年表・ライブラリ）
- Knowledge Base
- Maintenance Records（整備実績）
- Media（写真・動画管理）
- SEO
- Administration（管理画面）

## 10. デザイン思想（後回しだが方向性として明記）

英国／クラシック／重厚感／高級感／老舗／専門店／唯一無二。参考サイトはカーセンサー（見やすさ・分かりやすさ）、車選びドットコム（情報量・詳細さ）。

## 11. 将来対応（初期リリースでは実装しないが設計上考慮する）

- CSV連携
- 外部API連携
- 車選びドットコム／グーネット／カーセンサー等の外部媒体連携
- LINE API連携（初期は公式LINEへの遷移のみでよい）
- OCR
- AI補助機能の拡張
- 多言語対応

**注意**：外部媒体に依存する設計は禁止。将来対応できるようデータ構造だけ考慮する。

## 12. 実装禁止事項

- 推測による仕様追加
- 同一データの重複管理
- 物理削除（論理削除を用いる）
- HTMLベタ書きCMS
- 密結合
- 循環参照
- ハードコードされたカテゴリ

## 13. 開発フロー

Requirements → Architecture → Database → API → UI → Implementation → Testing → Refactoring → Documentation

この順序を厳守し、コードを書く前に必ず設計を完了させる。

## 14. ドキュメント構成

```
docs/
  requirements/   ← 今ここ
  architecture/
  database/
  api/
  screens/
  development/
  decisions/      （ADR: Architecture Decision Record）
  tasks/
```

各ドメインの仕様書は以下16項目の構成で統一する：
Purpose / Scope / Business Rules / Entity Definition / Database Schema / Relationships / Validation Rules / State Machine / Search Specification / Admin UI Specification / Public UI Specification / API Specification / Error Handling / Performance Requirements / Security Requirements / Acceptance Criteria

## 15. 完了条件

- コード量ではなく品質を優先する
- 要件が曖昧なまま実装しない
- 設計変更はADRへ記録する
- 最終成果物は、将来AIが入れ替わっても継続開発できる品質の設計リポジトリとする
