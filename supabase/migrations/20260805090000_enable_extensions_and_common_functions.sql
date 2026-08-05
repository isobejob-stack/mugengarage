-- 拡張機能の有効化と、全テーブル共通の updated_at 自動更新トリガー関数
-- （table_definitions.md 3章 共通ルール）
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
