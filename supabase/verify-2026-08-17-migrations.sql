-- 2026-08-17 のマイグレーション4本が本当に適用されたかを確認するSQL
--
-- Supabase > SQL Editor にこのファイルの中身を丸ごと貼って実行してください。
-- 「結果」列がすべて OK なら4本とも適用済みです。
-- 何も書き換えないので、何度実行しても安全です。
--
-- NG が出たものだけ、対応する supabase/migrations/ のSQLを流し直してください。
-- マイグレーションはどれも冪等（何度流しても二重に増えない）です。

select * from (

  -- ① 20260817010000: 整備実績をブログ記事へ統合
  select
    1 as 順番,
    '① 整備実績→ブログ統合' as 確認項目,
    case when count(*) = 0 then 'OK（未移行の整備実績なし）'
         else 'NG（未移行が ' || count(*) || ' 件。20260817010000 を流す）' end as 結果
  from maintenance_records
  where deleted_at is null

  union all

  -- ① のつづき: 記事カテゴリが5分類に揃っているか
  select
    2,
    '① 記事カテゴリの5分類化',
    case when count(*) = 0 then 'OK（旧カテゴリ・未設定の記事なし）'
         else 'NG（旧カテゴリの記事が ' || count(*) || ' 件。20260817010000 を流す）' end
  from articles
  where deleted_at is null
    and (category is null
         or category in ('モデル紹介', '歴史', 'ブランドストーリー', '維持・メンテナンス'))

  union all

  -- ② 20260817020000: 画面の文言を編集するテーブル
  select
    3,
    '② site_texts テーブル',
    case when count(*) = 1 then 'OK（テーブルあり）'
         else 'NG（テーブルが無い。20260817020000 を流す）' end
  from information_schema.tables
  where table_schema = 'public' and table_name = 'site_texts'

  union all

  -- ③ 20260817090000: 問い合わせの経路に「来店」を追加
  select
    4,
    '③ 問い合わせに「来店」',
    case when count(*) = 1 then 'OK（visit が許可されている）'
         else 'NG（visit が未許可。20260817090000 を流す）' end
  from pg_constraint
  where conname = 'inquiries_channel_check'
    and pg_get_constraintdef(oid) like '%visit%'

  union all

  -- ④ 20260817120000: 図鑑に1990年以降の車種・エンジン（9件）
  select
    5,
    '④ 図鑑の1990年以降（9件）',
    case when count(*) = 9 then 'OK（9件すべてあり）'
         else 'NG（' || count(*) || '/9 件。下の⑤も見ること）' end
  from encyclopedia_entries
  where slug in (
    'enc-xk-modern', 'enc-s-type-modern', 'enc-x-type',
    'enc-aj16-engine', 'enc-aj-v8-engine',
    'enc-xj-x300', 'enc-xj-x308', 'enc-xj-x350', 'enc-xj-x351'
  )

  union all

  -- ⑤ ④のうちXJの4件は、親エントリ（slug = 'enc-xj'）が存在しないと
  --    エラーを出さずに1件も入らない。④が 5/9 ならこれが原因。
  select
    6,
    '⑤ XJ4件の親（enc-xj）',
    case when count(*) = 1 then 'OK（親エントリあり）'
         else 'NG（親が無いのでXJ4件は入らない。図鑑のXJのslugを enc-xj にするか、'
              || '20260817120000 の enc-xj を実際のslugに直して流し直す）' end
  from encyclopedia_entries
  where slug = 'enc-xj' and deleted_at is null

) t order by 順番;
