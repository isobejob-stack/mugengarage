# ISSUE-002: Row Level Security（RLS）ポリシーが未設計

## 起票日

2026-08-05

## 内容

`supabase/migrations/` の初期マイグレーションでは、`03_non_functional_requirements.md` 9章（顧客情報の保護）を踏まえ、全テーブルで `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` を実行しているが、具体的なRLSポリシー（誰が・どの行を・読み書きできるか）は一切定義していない。

## 理由（BR-SCOPE-003：推測による仕様追加の禁止）

RLSポリシーの設計には、テーブルごとの詳細な認可要件（例：公開ページからの匿名読み取りを許可する対象は「status=published かつ deleted_at IS NULL の行のみ」か、CRM系テーブルはservice role経由のみに限定するか等）が必要だが、`docs/api/authentication.md` はAPI層（Next.js Route Handlers）でのセッション検証を前提とした設計であり、テーブル単位のRLSポリシーまでは規定していない。誤ったポリシーを推測で設計すると「データが読めない（機能停止）」または「意図せず公開される（情報漏洩）」のどちらの事故にもつながるため、ここでは安全側（RLS有効・ポリシー無し＝匿名キーからは全面アクセス不可）に倒し、ポリシー設計そのものは持ち越した。

## 影響

- 現状、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（`lib/supabase/client.ts`, `lib/supabase/server.ts` が使用）経由では、ポリシーが追加されるまでどのテーブルにもSELECT/INSERT等ができない
- Route HandlersでSupabaseへの実クエリを実装する前に、以下のいずれかの方針を決める必要がある
  1. 公開系エンドポイント（rest_api.md で「認証不要」とされているGET）に対応するテーブル・行に限定した公開SELECTポリシーを設計する
  2. サーバー側（Route Handlers）は `SUPABASE_SERVICE_ROLE_KEY`（RLSを bypass する）を使い、認可判定はアプリケーション層（authentication.md準拠のセッション検証）に一本化する

## ステータス

未解決（人間の判断待ち。実装フェーズ着手前に方針決定が必要）
