-- ライブ編集用：コード内に直接書かれていた固定文言をDBで持てるようにする
--
-- 背景:
-- 車両・記事・図鑑のようにDB由来の内容は管理画面から直せるが、
-- 「30年以上の実績を持つクラシックJaguar専門店。」のような画面上の固定文言は
-- コードに書かれており、直すには開発者が必要だった。
-- 発注者からの要望「本番画面と全く同じものを見ながらクリックして編集できる状態」を
-- 満たすには、この種の文言もDBに逃がす必要がある。
--
-- 設計:
-- key に「どの画面のどこか」を表す文字列（例: home.hero.lead）を入れ、value に文言を入れる。
-- 画面側は既定文言をコードに残したまま <SiteText k="..."> で包み、
-- DBに行があればそちらを優先する。したがって:
--   - このテーブルが空でも、マイグレーション未適用でも、画面は今までどおり表示される
--   - 編集して初めて行が増える（未編集の文言の行は作られない）
-- という段階的な移行になる。

create table if not exists site_texts (
  -- 画面上の位置を表すキー。ドット区切りで「ページ.ブロック.役割」を表す
  key text primary key,
  value text not null,
  -- 管理画面の一覧で「どの画面の文言か」を人間が見て分かるようにするための説明。
  -- 画面側から渡された最新の説明で上書きされる
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_site_texts_updated_at
before update on site_texts
for each row execute function set_updated_at();

-- 公開サイトの表示は service role 経由（lib/supabase/admin.ts）で読むため、
-- 他のテーブルと同様にRLSを有効化しておく（匿名キーからは触れない）。
alter table site_texts enable row level security;
