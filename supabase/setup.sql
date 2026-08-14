-- ============================================================
-- エムガレージ サイト セットアップ用SQL（これ1つを実行すれば完了）
--
-- 使い方:
--   1. https://supabase.com/dashboard を開く
--   2. プロジェクトを選ぶ
--   3. 左メニューの「SQL Editor」→「New query」
--   4. このファイルの中身を全部コピーして貼り付け
--   5. 右下の「Run」を押す
--
-- 何度実行しても問題ありません（同じものは二重に作られません）。
-- 途中でエラーが出たら、そのメッセージをそのまま伝えてください。
-- ============================================================


-- ============================================================
-- 1. 店舗情報の保存先
--    住所・電話番号・営業時間・LINEのURL・SNSリンクを
--    管理画面から編集できるようにするための入れ物です。
-- ============================================================
create table if not exists site_settings (
  -- 店舗は1つなので、1行だけしか作れないようにしています
  id text primary key default 'singleton' check (id = 'singleton'),

  postal_code text,
  address text,
  phone text,
  business_hours text,
  closed_days text,
  founded_year integer,
  representative_name text,
  access_info text,

  -- サイト全体の「LINEで相談する」ボタンの行き先。
  -- 未設定のあいだはボタン自体を表示しません（仮のURLに飛ばさないため）
  line_url text,

  -- グーネット・Instagram等のリンク。増減できるよう配列で持ちます
  external_links jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

-- トップページの大きな写真の保存場所（あとで管理画面からアップロードします）
alter table site_settings add column if not exists hero_image_path text;

-- 設定を入れる箱を1つだけ用意します
insert into site_settings (id) values ('singleton')
on conflict (id) do nothing;


-- ============================================================
-- 2. 写真の保管場所
--    店舗やガレージの写真を置くための場所です。
--    （車両写真とは別に、店そのものを見せる写真用）
-- ============================================================
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;


-- ============================================================
-- 3. 車の情報として足りていなかった項目を追加
--    中古車サイト（カーセンサー・グーネット等）で普通に載っている情報のうち、
--    今のシステムでは持てなかったものを追加します。
-- ============================================================

-- 支払総額（これまでは車両本体価格しか入れられませんでした）
alter table vehicles add column if not exists total_price integer;

-- 車検の状態。
-- これまでは「日付」しか入れられず、「車検整備付」を表せませんでした。
-- 実際の在庫15台のうち13台が「車検整備付」なので、この形が必要です。
alter table vehicles
  add column if not exists shaken_status text
    check (shaken_status in ('inspection_included', 'valid_until', 'none'));

-- 取引条件（法定整備・保証・リサイクル料金）
alter table vehicles
  add column if not exists legal_maintenance text
    check (legal_maintenance in ('included', 'separate', 'none')),
  add column if not exists warranty_type text
    check (warranty_type in ('with', 'without')),
  add column if not exists warranty_months integer,
  add column if not exists warranty_km integer,
  add column if not exists recycle_fee text
    check (recycle_fee in ('included', 'separate', 'none'));

-- 車両の基本情報（ハンドル位置は輸入車では特に重要）
alter table vehicles
  add column if not exists steering_side text
    check (steering_side in ('right', 'left')),
  add column if not exists fuel_type text,
  add column if not exists capacity integer,
  add column if not exists door_count integer,
  add column if not exists has_record_book boolean,
  add column if not exists is_non_smoking boolean,
  add column if not exists model_code text,
  add column if not exists location_text text;


-- ============================================================
-- 4. 監査ログの不具合修正
--    店舗情報を変更したとき、その記録が残らない不具合がありました。
--    （記録用の欄が数字専用で、文字を受け付けなかったため）
-- ============================================================
alter table audit_logs alter column target_id type text using target_id::text;


-- ============================================================
-- 5. 在庫車両 15台の登録
--    グーネットの掲載内容をもとにしたデータです。
--    あとで管理画面から編集・削除できます。
-- ============================================================

-- メーカー（ダブルシックスはデイムラー名義なので分けています）
insert into manufacturers (name, slug) values
  ('ジャガー', 'jaguar'),
  ('デイムラー', 'daimler')
on conflict do nothing;

-- 車種
insert into models (manufacturer_id, name, slug) values
  ((select id from manufacturers where name = 'ジャガー'), 'XJ', 'xj'),
  ((select id from manufacturers where name = 'ジャガー'), 'Xタイプ', 'x-type'),
  ((select id from manufacturers where name = 'ジャガー'), 'Sタイプ', 's-type'),
  ((select id from manufacturers where name = 'ジャガー'), 'XJ-S', 'xj-s'),
  ((select id from manufacturers where name = 'デイムラー'), 'ダブルシックス', 'double-six')
on conflict (slug) do nothing;

-- 車両本体
-- 価格は「本体価格」「支払総額」の順です。
-- 車検は「車検整備付」「満了日あり」「なし」の3状態で入れています。
-- 満了日が年月までしか分からない車両は、その月の1日を入れて画面には「◯年◯月」とだけ出します
-- （日まで推測で埋めると、購入判断に関わる情報を間違って出すことになるため）。
insert into vehicles (
  id, manufacturer_id, model_id, status, is_new_arrival,
  price, total_price, displacement_cc, model_year, mileage_km, accident_history,
  shaken_status, shaken_expiry, legal_maintenance, warranty_type, warranty_months, warranty_km,
  sales_comment, other_notes, display_order
) values
  ('c0000000-0000-4000-8000-000000000001',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', true, 590000, 730000, 4200, 2007, 187000, false,
   'valid_until', '2027-02-01', 'included', 'with', 1, 1000,
   'XJ 4.2 ソブリンL ロングボディー。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 2027年2月（満了日は車検証で要確認）', 1),

  ('c0000000-0000-4000-8000-000000000002',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 880000, 1150000, 3500, 2004, 88000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ8 3.5。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 2),

  ('c0000000-0000-4000-8000-000000000003',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'x-type'),
   'published', false, 390000, 550000, 2100, 2008, 64000, true,
   'valid_until', '2027-05-01', 'included', 'with', 1, 1000,
   'Xタイプ 2.0 エグゼクティブ。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 2027年5月（満了日は車検証で要確認）／修復歴あり', 3),

  ('c0000000-0000-4000-8000-000000000004',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 2980000, 3150000, 4200, 2008, 52000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ ポートフォリオ。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 4),

  ('c0000000-0000-4000-8000-000000000005',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 980000, 1230000, 3500, 2003, 75000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ8 3.5。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 5),

  ('c0000000-0000-4000-8000-000000000006',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 1580000, 1790000, 3200, 1995, 49000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 6),

  ('c0000000-0000-4000-8000-000000000007',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 3280000, 3490000, 4200, 1983, 86000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ6 4.2 シリーズII。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 7),

  ('c0000000-0000-4000-8000-000000000008',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 980000, 1230000, 3200, 1998, 59000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ エグゼクティブ 3.2 V8。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 8),

  ('c0000000-0000-4000-8000-000000000009',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 2380000, 2530000, 3200, 1993, 68000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 9),

  ('c0000000-0000-4000-8000-000000000010',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 's-type'),
   'published', false, 390000, 630000, 3000, 2004, 87000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'Sタイプ 3.0 V6。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 10),

  ('c0000000-0000-4000-8000-000000000011',
   (select id from manufacturers where name = 'デイムラー'),
   (select id from models where slug = 'double-six'),
   'published', false, 4350000, 4550000, 5300, 1990, 59000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'デイムラー ダブルシックス。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 11),

  ('c0000000-0000-4000-8000-000000000012',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 1780000, 1970000, 4000, 1995, 100000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJR 4.0 スーパーチャージド。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 12),

  ('c0000000-0000-4000-8000-000000000013',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false, 1980000, 2150000, 3200, 1994, 77000, false,
   'none', null, 'included', 'with', 1, 1000,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。', '車検: なし', 13),

  ('c0000000-0000-4000-8000-000000000014',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj-s'),
   'published', false, 3980000, 4230000, 4000, 2002, 150000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'XJ-S 4.0 コンバーチブル。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付／年式は掲載情報のまま登録（XJ-Sの生産は1996年までのため、年式または車種名の確認を推奨）', 14),

  ('c0000000-0000-4000-8000-000000000015',
   (select id from manufacturers where name = 'デイムラー'),
   (select id from models where slug = 'double-six'),
   'published', false, 2980000, 3160000, 6000, 1995, 66000, false,
   'inspection_included', null, 'included', 'with', 1, 1000,
   'デイムラー ダブルシックス。法定整備付・保証付（1ヶ月/1000km）。', '車検: 車検整備付', 15)
on conflict (id) do nothing;

-- 各車両のURL（これが無いと一覧に出ません）
insert into seo_metas (target_type, target_id, slug, title, description) values
  ('vehicle', 'c0000000-0000-4000-8000-000000000001', 'xj-4-2-sovereign-l-2007', 'ジャガー XJ 4.2 ソブリンL ロングボディー 2007年', '走行18.7万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000002', 'xj8-3-5-2004', 'ジャガー XJ8 3.5 2004年', '走行8.8万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000003', 'x-type-2-0-executive-2008', 'ジャガー Xタイプ 2.0 エグゼクティブ 2008年', '走行6.4万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000004', 'xj-portfolio-2008', 'ジャガー XJ ポートフォリオ 2008年', '走行5.2万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000005', 'xj8-3-5-2003', 'ジャガー XJ8 3.5 2003年', '走行7.5万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000006', 'xj6-3-2-1995', 'ジャガー XJ6 3.2 1995年', '走行4.9万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000007', 'xj6-4-2-series2-1983', 'ジャガー XJ6 4.2 シリーズII 1983年', '走行8.6万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000008', 'xj-executive-3-2-v8-1998', 'ジャガー XJ エグゼクティブ 3.2 V8 1998年', '走行5.9万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000009', 'xj6-3-2-1993', 'ジャガー XJ6 3.2 1993年', '走行6.8万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000010', 's-type-3-0-v6-2004', 'ジャガー Sタイプ 3.0 V6 2004年', '走行8.7万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000011', 'daimler-double-six-1990', 'デイムラー ダブルシックス 1990年', '走行5.9万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000012', 'xjr-4-0-supercharged-1995', 'ジャガー XJR 4.0 スーパーチャージド 1995年', '走行10.0万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000013', 'xj6-3-2-1994', 'ジャガー XJ6 3.2 1994年', '走行7.7万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000014', 'xj-s-4-0-convertible-2002', 'ジャガー XJ-S 4.0 コンバーチブル 2002年', '走行15.0万km。法定整備付・保証付。'),
  ('vehicle', 'c0000000-0000-4000-8000-000000000015', 'daimler-double-six-1995', 'デイムラー ダブルシックス 1995年', '走行6.6万km。法定整備付・保証付。')
on conflict do nothing;


-- ============================================================
-- 完了確認
--    実行後、下に「15」と表示されれば成功です。
-- ============================================================
select count(*) as 登録された車両の台数
from vehicles
where id::text like 'c0000000-0000-4000-8000-%';
