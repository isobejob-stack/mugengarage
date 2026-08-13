-- 中古車掲載サイト（カーセンサー・グーネット・車選びドットコム）で標準的に掲載される項目のうち、
-- 現状のvehiclesテーブルで表現できていなかったものを追加する（docs/tasks/ISSUE-006）。
--
-- 既存データを壊さないよう、追加カラムはすべて nullable とする。
-- 表示側は「未設定の項目は出さない」方針のため、未入力のままでも画面は崩れない。

-- ── 車検の状態（最優先）──────────────────────────────────
-- 従来は shaken_expiry（date）しか無く、「車検整備付」「車検なし」を表現できなかった。
-- 実在庫15台のうち13台が「車検整備付」であり、日付が存在しないため
-- seed投入時に日付を空にして備考へ文字で逃がすしかなく、検索条件からも車検を外す原因になった。
--
-- 状態と日付を分けることで、実際の掲載表記をそのまま表現できるようにする。
--   inspection_included : 車検整備付（納車時に車検を取得する）
--   valid_until         : 満了日あり（shaken_expiry を併用する）
--   none                : 車検なし
-- 未設定（NULL）の場合は表示しない。
alter table vehicles
  add column if not exists shaken_status text
    check (shaken_status in ('inspection_included', 'valid_until', 'none'));

comment on column vehicles.shaken_expiry is
  '車検満了日。shaken_status = ''valid_until'' のときのみ使用する';

-- ── 取引条件 ────────────────────────────────────────────
-- 全掲載車に「法定整備：整備付」「保証付（1ヶ月・1000km）」の記載があったが、
-- いずれも持てていなかった。購入総額と信頼性の判断に直結する情報のため追加する。
alter table vehicles
  add column if not exists legal_maintenance text
    check (legal_maintenance in ('included', 'separate', 'none')),
  add column if not exists warranty_type text
    check (warranty_type in ('with', 'without')),
  add column if not exists warranty_months integer,
  add column if not exists warranty_km integer,
  add column if not exists recycle_fee text
    check (recycle_fee in ('included', 'separate', 'none'));

-- ── 車両基本情報 ─────────────────────────────────────────
-- steering_side: クラシックJaguarは輸入車であり、右ハンドルか左ハンドルかは
-- 購入判断を大きく左右する。国産中心のサイトより本店では重要度が高い。
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
