-- 店舗情報・外部リンクを管理画面から編集できるようにするための設定テーブル。
--
-- 背景: 住所・電話番号・営業時間・LINE URL・SNSリンクがコード内の定数
-- （lib/site-config.ts）にハードコードされており、変更のたびに開発とデプロイが必要だった。
-- とくに LINE_URL は仮の値のまま全ページのCTAに使われており、
-- 開発者を介さないと最重要導線が直せない状態になっていた（docs/tasks/ISSUE-005）。
--
-- 設計: 店舗は1つなので、単一行だけを持つテーブルとする。
-- id を固定値で1行だけ挿入し、CHECK制約で複数行が作られないようにする
-- （行が増えるとどれが正なのか分からなくなるため、DB側で構造的に防ぐ）。
create table site_settings (
  -- 単一行を保証するための固定ID。'singleton' 以外は入れられない
  id text primary key default 'singleton' check (id = 'singleton'),

  -- 店舗情報。未入力の状態から運用を始められるよう、すべて nullable とする。
  -- 空文字ではなくNULLを「未設定」として扱い、表示側はNULLの項目を出さない
  -- （誤った情報や空欄をユーザーに見せないため）。
  postal_code text,
  address text,
  phone text,
  business_hours text,
  closed_days text,
  founded_year integer,
  representative_name text,
  access_info text,

  -- 最重要CTA。ここが未設定のあいだは、画面側でLINEボタン自体を出さない判断ができるよう
  -- NULL許容にしている（仮URLへ飛ばすより、出さないほうが害が小さい）。
  line_url text,

  -- 外部掲載媒体・公式SNS。媒体は今後増減しうるため、列を増やさずJSONBの配列で持つ。
  -- 形式: [{ "label": "Instagram", "url": "https://...", "description": "..." }]
  -- 並び順は配列の順序をそのまま表示順として扱う。
  external_links jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

-- 初期行。値はすべて未設定（NULL）で作成し、管理画面から入力してもらう。
-- 行が存在しない場合のハンドリングを各所に書かなくて済むよう、ここで1行だけ用意しておく。
insert into site_settings (id) values ('singleton');

-- audit_logs.target_id は uuid だったが、site_settings は単一行のため 'singleton' という
-- UUIDではないIDを持つ。このままでは設定変更時の監査ログINSERTが型違反で失敗する。
-- しかも recordAuditLog は insert のエラーを見ていないため、画面上は成功したように見えて
-- ログだけが記録されない「サイレント失敗」になる（20260807120000 で restore アクションが
-- CHECK制約に無く同じ壊れ方をしたのと同種の問題）。
--
-- 「監査対象は必ずUUIDを持つ」という前提自体が成り立たなくなったため、target_id を text に広げる。
-- uuid から text へのキャストは既存行でも必ず成功する。
alter table audit_logs
  alter column target_id type text using target_id::text;
