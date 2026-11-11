-- ============================================================
-- 裏付けが取れなかった記述を、図鑑・年表・ブログ・ライブラリから消すSQL
-- 版数: v1（2026-11-11）
--
-- 店主の判断（2026-11-11）: 「確信が持てないものは消しておいてOK」
--
-- 消すもの（その記述を含む「文」だけを消します。記事やページ自体は消しません）:
--   A. Mark VII の1956年モンテカルロ・ラリー優勝
--        … 裏付けが二次資料しかないため。
--          年表に「モンテカルロ」が見出しの出来事があれば、その出来事ごと非公開にする
--          （管理画面の「削除」と同じ扱いで、「削除済み」から元に戻せます）
--   B. XK150 の4輪ディスクブレーキが標準装備かオプションか
--        … 資料によって答えが違うため。
--          「ディスク」と「標準／オプション／ドラム」が同じ文に出てくる文を消す
--          （XK150 の項目の中の文と、ほかの本文で XK150 に触れている文が対象）
--   C. XJ-C の総生産台数（8,378台か9,378台か）
--        … 資料によって数字が違うため。どちらかの数字を含む文を消す
--   D. Eタイプの価格が同時代のイタリア製GTの「半分に近い」
--        … 具体的な金額を確認できなかったため
--
-- 消さないもの:
--   記事「クラシックジャガーと長く付き合うために」の整備の間隔は、
--   事実の記述ではなく「目安」なので残しています。
--   お店としての推奨値があれば、管理画面のブログから書き換えてください。
--
-- 使い方:
--   1. https://supabase.com/dashboard を開き、プロジェクトを選ぶ
--   2. 左メニューの「SQL Editor」→「New query」
--      ※ 前に使ったタブで「Run」を押し直すと、古い内容のまま実行されます。
--        必ず「New query」で新しいタブを開いてください。
--   3. このファイルの中身を全部コピーして貼り付け、右下の「Run」を押す
--   4. 結果の表に、消した文が1行ずつ出ます（どのページの、どの文か）
--      「返された行はありません」と出たら、消す対象が見つからなかったということです
--
-- 書き換える前の本文は、表 content_backup_20261111 に保存します。
-- 2回以上実行しても大丈夫です（2回目は消すものが無いので、何も変わりません）。
-- 途中でエラーが出た場合は、何も変更されずに元のままです。
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 0. 消す文の見つけ方（このSQLの中だけで使う一時的な関数です）
--    「文」は、句点「。」・改行・表の区切り「|」で区切られた範囲とします
-- ------------------------------------------------------------

-- in_xk150: その本文が XK150 の項目かどうか（B の判定に使う）
create function pg_temp.unverified_pattern(in_xk150 boolean)
returns text language sql immutable as $fn$
  select
    -- A. モンテカルロ
    '[^。\n|]*モンテカルロ[^。\n|]*。?'
    -- B. XK150 のディスクブレーキの標準／オプション
    || '|[^。\n|]*XK150[^。\n|]*ディスク[^。\n|]*(標準|オプション|ドラム)[^。\n|]*。?'
    || '|[^。\n|]*XK150[^。\n|]*(標準|オプション|ドラム)[^。\n|]*ディスク[^。\n|]*。?'
    || '|[^。\n|]*ディスク[^。\n|]*(標準|オプション|ドラム)[^。\n|]*XK150[^。\n|]*。?'
    || '|[^。\n|]*(標準|オプション|ドラム)[^。\n|]*ディスク[^。\n|]*XK150[^。\n|]*。?'
    || case when in_xk150 then
         '|[^。\n|]*ディスク[^。\n|]*(標準|オプション|ドラム)[^。\n|]*。?'
         || '|[^。\n|]*(標準|オプション|ドラム)[^。\n|]*ディスク[^。\n|]*。?'
       else '' end
    -- C. XJ-C の総生産台数
    || '|[^。\n|]*[89],?378[^。\n|]*。?'
    -- D. Eタイプとイタリア製GTの価格比較
    || '|[^。\n|]*イタリア[^。\n|]*半分[^。\n|]*。?'
    || '|[^。\n|]*半分[^。\n|]*イタリア[^。\n|]*。?'
$fn$;

-- 文を消したあとに残る、中身の無い箇条書き・見出しの行と、続きすぎた空行を片付ける
create function pg_temp.strip_unverified(t text, in_xk150 boolean)
returns text language sql immutable as $fn$
  select btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(t, pg_temp.unverified_pattern(in_xk150), '', 'g'),
        '(^|\n)[ \t　]*([-*+]|#{1,6}|[0-9]+\.)?[ \t　]*(?=\n|$)', '\1', 'g'),
      '\n{3,}', E'\n\n', 'g'),
    E' \t\n')
$fn$;

-- ------------------------------------------------------------
-- 1. 書き換える前の本文を保存する（元に戻したいとき用）
-- ------------------------------------------------------------
create table if not exists content_backup_20261111 (
  table_name text not null,
  row_key    text not null,
  column_name text not null,
  old_value  text,
  saved_at   timestamptz not null default now(),
  primary key (table_name, row_key, column_name)
);
-- 公開画面から読めないようにする（RLSを有効にしてポリシーを作らない）
alter table content_backup_20261111 enable row level security;

insert into content_backup_20261111 (table_name, row_key, column_name, old_value)
select 'encyclopedia_entries', id::text, 'body', body from encyclopedia_entries
 where deleted_at is null
   and body ~ pg_temp.unverified_pattern(title ~* 'XK ?150' or slug ~* 'xk-?150')
union all
select 'timeline_events', id::text, 'body', body from timeline_events
 where deleted_at is null and body ~ pg_temp.unverified_pattern(title ~* 'XK ?150')
union all
select 'timeline_events', id::text, 'deleted_at', null from timeline_events
 where deleted_at is null and title like '%モンテカルロ%'
union all
select 'articles', id::text, 'body', body from articles
 where deleted_at is null and body ~ pg_temp.unverified_pattern(false)
union all
select 'library_entries', id::text, 'body', body from library_entries
 where deleted_at is null and body ~ pg_temp.unverified_pattern(false)
union all
select 'site_texts', key, 'value', value from site_texts
 where value ~ pg_temp.unverified_pattern(false)
on conflict do nothing;

-- ------------------------------------------------------------
-- 2. 消して、消した文を一覧で出す
--    （下の select が見るのは書き換える前の本文です）
-- ------------------------------------------------------------
with
enc as (
  update encyclopedia_entries
     set body = pg_temp.strip_unverified(body, title ~* 'XK ?150' or slug ~* 'xk-?150')
   where deleted_at is null
     and body ~ pg_temp.unverified_pattern(title ~* 'XK ?150' or slug ~* 'xk-?150')
  returning id
),
tl_hide as (
  update timeline_events
     set deleted_at = now()
   where deleted_at is null and title like '%モンテカルロ%'
  returning id
),
tl as (
  update timeline_events
     set body = pg_temp.strip_unverified(body, title ~* 'XK ?150')
   where deleted_at is null
     and title not like '%モンテカルロ%'
     and body ~ pg_temp.unverified_pattern(title ~* 'XK ?150')
  returning id
),
art as (
  update articles
     set body = pg_temp.strip_unverified(body, false)
   where deleted_at is null and body ~ pg_temp.unverified_pattern(false)
  returning id
),
lib as (
  update library_entries
     set body = pg_temp.strip_unverified(body, false)
   where deleted_at is null and body ~ pg_temp.unverified_pattern(false)
  returning id
),
txt as (
  update site_texts
     set value = pg_temp.strip_unverified(value, false)
   where value ~ pg_temp.unverified_pattern(false)
  returning key
),
removed as (
  select '図鑑' as 場所, e.title as ページ, m[1] as 消した文
    from encyclopedia_entries e
    cross join lateral regexp_matches(
      e.body, '(' || pg_temp.unverified_pattern(e.title ~* 'XK ?150' or e.slug ~* 'xk-?150') || ')', 'g') m
   where e.id in (select id from enc)
  union all
  select '年表（出来事ごと非公開）', t.title, coalesce(t.body, '')
    from timeline_events t where t.id in (select id from tl_hide)
  union all
  select '年表', t.title, m[1]
    from timeline_events t
    cross join lateral regexp_matches(
      t.body, '(' || pg_temp.unverified_pattern(t.title ~* 'XK ?150') || ')', 'g') m
   where t.id in (select id from tl)
  union all
  select 'ブログ', a.title, m[1]
    from articles a
    cross join lateral regexp_matches(a.body, '(' || pg_temp.unverified_pattern(false) || ')', 'g') m
   where a.id in (select id from art)
  union all
  select 'ライブラリ', l.title, m[1]
    from library_entries l
    cross join lateral regexp_matches(l.body, '(' || pg_temp.unverified_pattern(false) || ')', 'g') m
   where l.id in (select id from lib)
  union all
  select '画面の文言', s.key, m[1]
    from site_texts s
    cross join lateral regexp_matches(s.value, '(' || pg_temp.unverified_pattern(false) || ')', 'g') m
   where s.key in (select key from txt)
)
select 場所, ページ, btrim(消した文) as 消した文
  from removed
 where btrim(消した文) <> ''
 order by 場所, ページ;

commit;

-- ============================================================
-- 元に戻したいとき（1件ずつ）:
--   update encyclopedia_entries e set body = b.old_value
--     from content_backup_20261111 b
--    where b.table_name = 'encyclopedia_entries' and b.column_name = 'body'
--      and b.row_key = e.id::text;
--   （articles・library_entries・timeline_events も同じ書き方。
--     非公開にした年表の出来事は、管理画面の「削除済み」から戻せます）
-- ============================================================
