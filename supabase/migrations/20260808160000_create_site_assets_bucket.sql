-- 店舗写真など、特定の車両に紐づかないサイト素材用のStorageバケット。
--
-- 背景: 画像の保管先は vehicle-photos（車両に紐づく写真）しか無く、店舗外観・ガレージの様子など
-- 「店そのものを伝える写真」を置く場所が無かった。そのためトップページのヒーローは
-- 文字だけの暗い箱になっており、クラシックJaguar専門店として最も情緒に訴える資産である
-- 車や店の写真が第一印象に使われていなかった（docs/tasks/ISSUE-005）。
--
-- 公開サイトに直接表示する画像であり、vehicle-photos と同じ理由で public バケットとする
-- （非公開＋署名付きURLにする必要が無い）。
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true);

-- storage.objects のRLSに関する扱いは vehicle-photos と同一方針
-- （20260806090000_create_vehicle_photos_storage_bucket.sql のコメント参照）。
-- 書き込みは Route Handler が createAdminClient() 経由でのみ行い、
-- 匿名/authenticatedキーからの直接書き込みはポリシー無し＝拒否のまま多層防御として残す。

-- トップページのヒーロー画像。site-assets バケット内のオブジェクトパスを保持する。
-- 未設定（NULL）の場合、公開サイト側は従来の文字ベースのヒーローにフォールバックする。
alter table site_settings
  add column hero_image_path text;
