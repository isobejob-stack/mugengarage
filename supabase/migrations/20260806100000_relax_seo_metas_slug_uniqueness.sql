-- レビュー指摘対応（必須修正3）: seo_metas.slugのUNIQUE制約をドメイン単位（target_type + slug）に緩和する。
--
-- 各コンテンツ種別の公開URLは /vehicles/, /blog/, /encyclopedia/, /library/,
-- /maintenance-records/ のようにプレフィックスで完全に分離されている（lib/seo/paths.ts）ため、
-- target_typeをまたいだslugの一意性はURL設計上そもそも不要であり、
-- ドメインをまたいだ偶然のslug重複だけで更新が失敗してしまう問題を解消する。
--
-- BR-URL-003「全コンテンツタイプはSEOメタ情報を個別に持てる」の趣旨にも合致する。
-- 同一target_type内でのslug一意性は従来通り維持する。
alter table seo_metas drop constraint if exists seo_metas_slug_key;

create unique index seo_metas_target_type_slug_idx on seo_metas (target_type, slug);
