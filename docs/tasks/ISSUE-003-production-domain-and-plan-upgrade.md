# ISSUE-003: 本番公開前にVercel Proプラン移行＋独自ドメイン設定が必要

## 起票日

2026-08-05

## 内容

現在、本プロジェクトはVercelのHobby（無料）プランで`https://mugengarage.vercel.app`として動作している。Vercel公式ドキュメント（[Hobby Plan](https://vercel.com/docs/plans/hobby), 2026-06-16更新版）に以下の明記がある。

> As stated in the fair use guidelines, the Hobby plan restricts users to non-commercial, personal use only.

エムガレージは実店舗の商用サイトであり、Hobbyプランでの本番運用はVercelの利用規約（fair use guidelines）に反する。

## やるべきこと（本番公開までに）

1. **Vercel Proプランへのアップグレード**
   - Vercelダッシュボード > Settings > Billing から実施（発注者/isobejob本人のクレジットカード登録・支払いが必要なため、Claude Codeは代行不可）
   - 14日間の無料トライアルあり
2. **独自ドメインの取得・設定**
   - ドメイン名：`m-garage.com`（2026-08-05時点で決定、まだ未取得）
   - 購入先：Vercel経由での購入を予定（DNS設定が自動で行われるため）
   - 取得後、Vercel Settings > Domains に追加すればDNS設定は自動化される（deployment.md 8章）
   - ドメイン購入は決済を伴うため、Claude Codeは代行不可（本人の操作が必要）

## 注意点

- **独自ドメインを設定するだけではプラン規約違反は解消しない**。Proプランへのアップグレードとドメイン設定はセットで必要
- 開発・Preview環境での`*.vercel.app`利用は許容範囲内（Hobbyプランの想定用途）

## ステータス

未着手（2026-08-05時点：ドメイン名・購入先は決定済み。購入操作は発注者の準備が整うまで保留）
