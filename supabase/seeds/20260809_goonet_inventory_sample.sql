-- 在庫車両の投入用SQL（グーネット掲載情報より、2026-08-09時点）
--
-- これは「マイグレーション」ではなくデータ投入用のスクリプトのため、
-- supabase/migrations ではなく supabase/seeds に置く（migrationsに置くと
-- スキーマ適用のたびにデータまで再投入されてしまう）。
--
-- 実行方法: SupabaseのSQL Editorに貼り付けて実行する。
--
-- 【重要】このスクリプトは固定UUIDを使っている。理由は2つ:
--   1. seo_metas（URLのslug）から車両を参照する必要があるため、IDが確定している必要がある
--   2. テスト投入のため、あとからまとめて削除できるようにするため
-- 取り消したい場合は、このファイル末尾のコメントにある削除用SQLを実行する。
--
-- 【価格の扱い】price に車両本体価格、total_price に支払総額（諸費用込み）を入れる。
-- 公開サイトは支払総額が登録されていればそちらを主役に表示し、本体価格を併記する。
--
-- 【車検の扱い】shaken_expiry（車検満了日）は日付型だが、掲載情報では
-- 「2027年2月」のように年月までしか分からない、または「車検整備付」「なし」という
-- 状態表記になっている。満了"日"を推測で埋めると、購入判断に関わる情報を
-- 誤って表示することになるため、ここでは NULL のままとし、
-- 元の表記を other_notes に文字列として残している。
-- 車検証で正確な日付を確認できたら、管理画面から入力すること。

-- ── メーカー ─────────────────────────────────────────────
-- デイムラーはジャガーとは別メーカーとして扱う（ダブルシックスはデイムラー名義の車両）
insert into manufacturers (id, name, slug) values
  ('a0000000-0000-4000-8000-000000000001', 'ジャガー', 'jaguar'),
  ('a0000000-0000-4000-8000-000000000002', 'デイムラー', 'daimler')
on conflict (name) do nothing;

-- ── 車種 ────────────────────────────────────────────────
insert into models (id, manufacturer_id, name, slug) values
  ('b0000000-0000-4000-8000-000000000001',
   (select id from manufacturers where name = 'ジャガー'), 'XJ', 'xj'),
  ('b0000000-0000-4000-8000-000000000002',
   (select id from manufacturers where name = 'ジャガー'), 'Xタイプ', 'x-type'),
  ('b0000000-0000-4000-8000-000000000003',
   (select id from manufacturers where name = 'ジャガー'), 'Sタイプ', 's-type'),
  ('b0000000-0000-4000-8000-000000000004',
   (select id from manufacturers where name = 'ジャガー'), 'XJ-S', 'xj-s'),
  ('b0000000-0000-4000-8000-000000000005',
   (select id from manufacturers where name = 'デイムラー'), 'ダブルシックス', 'double-six')
on conflict (slug) do nothing;

-- ── 車両 ────────────────────────────────────────────────
insert into vehicles (
  id, manufacturer_id, model_id, status, is_new_arrival,
  price, total_price, displacement_cc, model_year, mileage_km, accident_history,
  sales_comment, other_notes, display_order
) values
  ('c0000000-0000-4000-8000-000000000001',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', true,
   590000, 730000, 4200, 2007, 187000, false,
   'XJ 4.2 ソブリンL ロングボディー。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 2027年2月（満了日は車検証で要確認）', 1),

  ('c0000000-0000-4000-8000-000000000002',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   880000, 1150000, 3500, 2004, 88000, false,
   'XJ8 3.5。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 2),

  ('c0000000-0000-4000-8000-000000000003',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'x-type'),
   'published', false,
   390000, 550000, 2100, 2008, 64000, true,
   'Xタイプ 2.0 エグゼクティブ。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 2027年5月（満了日は車検証で要確認）／修復歴あり', 3),

  ('c0000000-0000-4000-8000-000000000004',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   2980000, 3150000, 4200, 2008, 52000, false,
   'XJ ポートフォリオ。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 4),

  ('c0000000-0000-4000-8000-000000000005',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   980000, 1230000, 3500, 2003, 75000, false,
   'XJ8 3.5。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 5),

  ('c0000000-0000-4000-8000-000000000006',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   1580000, 1790000, 3200, 1995, 49000, false,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 6),

  ('c0000000-0000-4000-8000-000000000007',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   3280000, 3490000, 4200, 1983, 86000, false,
   'XJ6 4.2 シリーズII。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 7),

  ('c0000000-0000-4000-8000-000000000008',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   980000, 1230000, 3200, 1998, 59000, false,
   'XJ エグゼクティブ 3.2 V8。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 8),

  ('c0000000-0000-4000-8000-000000000009',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   2380000, 2530000, 3200, 1993, 68000, false,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 9),

  ('c0000000-0000-4000-8000-000000000010',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 's-type'),
   'published', false,
   390000, 630000, 3000, 2004, 87000, false,
   'Sタイプ 3.0 V6。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 10),

  ('c0000000-0000-4000-8000-000000000011',
   (select id from manufacturers where name = 'デイムラー'),
   (select id from models where slug = 'double-six'),
   'published', false,
   4350000, 4550000, 5300, 1990, 59000, false,
   'デイムラー ダブルシックス。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 11),

  ('c0000000-0000-4000-8000-000000000012',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   1780000, 1970000, 4000, 1995, 100000, false,
   'XJR 4.0 スーパーチャージド。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 12),

  ('c0000000-0000-4000-8000-000000000013',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj'),
   'published', false,
   1980000, 2150000, 3200, 1994, 77000, false,
   'XJ6 3.2。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: なし', 13),

  ('c0000000-0000-4000-8000-000000000014',
   (select id from manufacturers where name = 'ジャガー'),
   (select id from models where slug = 'xj-s'),
   'published', false,
   3980000, 4230000, 4000, 2002, 150000, false,
   'XJ-S 4.0 コンバーチブル。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付／年式は掲載情報のまま登録（XJ-Sの生産は1996年までのため、年式または車種名の確認を推奨）', 14),

  ('c0000000-0000-4000-8000-000000000015',
   (select id from manufacturers where name = 'デイムラー'),
   (select id from models where slug = 'double-six'),
   'published', false,
   2980000, 3160000, 6000, 1995, 66000, false,
   'デイムラー ダブルシックス。法定整備付・保証付（1ヶ月/1000km）。',
   '車検: 車検整備付', 15)
on conflict (id) do nothing;

-- ── URL（slug）────────────────────────────────────────────
-- 公開サイトの車両カード・詳細ページは seo_metas.slug を使って動く。
-- これが無いと一覧にカードが出ず（slugがnullの車両はスキップされる）、
-- 詳細ページにも到達できないため、車両とセットで必ず作成する。
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
on conflict (slug) do nothing;

-- ── 取り消したい場合 ──────────────────────────────────────
-- 以下を実行すると、このスクリプトで投入した車両とURLだけを削除できる
-- （メーカー・車種マスタは他でも使うため残す）。
--
--   delete from seo_metas
--    where target_type = 'vehicle'
--      and target_id::text like 'c0000000-0000-4000-8000-%';
--
--   delete from vehicles
--    where id::text like 'c0000000-0000-4000-8000-%';
