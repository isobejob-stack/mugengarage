-- 問い合わせ窓口の見直し（2026-11-08、店主の判断）。
--
-- 問い合わせは InstagramのDM に統一する（メール・電話より返信が早いため）。
-- Instagramを使っていない人のために、電話とメールの窓口を併記する。
-- 電話番号は site_settings.phone に既にあるが、メールアドレスを持つ列が無かったため追加する。
--
-- 未設定（NULL）のあいだは公開サイトに出さない（他の店舗情報と同じ方針）。
alter table site_settings
  add column if not exists email text;

comment on column site_settings.email is
  '問い合わせ用メールアドレス。公開サイトの問い合わせ窓口（mailto）に使う。未設定なら出さない';
