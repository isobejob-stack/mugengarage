-- レビュー指摘対応（必須修正3）: BR-HIST-002は「管理画面上の主要な変更操作」を監査ログとして
-- 記録することを求めているが、Vercel Cron Jobsによる公開予約の自動公開（FR-INV-007 /
-- FR-BLOG-004、app/api/cron/publish-scheduled/route.ts）はシステムによる自動更新であり、
-- 紐付けられる管理者（admin_users）が存在しない。従来はadmin_user_idがNOT NULL外部キーで
-- あることを理由に監査ログの記録自体を丸ごとスキップしていたが、これはBR-HIST-002の趣旨に反する。
--
-- actor_typeカラムを追加し、「誰が操作したか」を admin（管理者） / system（Cron等の自動処理）
-- の2種別で表現できるようにする。admin_user_idはsystemの場合のみNULLを許容し、
-- どちらの場合も一貫した状態（admin→admin_user_id必須、system→admin_user_id不可）を
-- CHECK制約で強制する（migration_policy.md 6章: NOT NULL制約の変更は既存データが条件を
-- 満たすことを確認してから行う。既存データはすべて管理者操作のためactor_type='admin'かつ
-- admin_user_idがNOT NULLであり、本制約に矛盾しない）。
alter table audit_logs
  add column actor_type text not null default 'admin'
    check (actor_type in ('admin', 'system'));

-- systemによる自動記録はadmin_user_idを持たないため、外部キーのNOT NULL制約を緩和する。
alter table audit_logs
  alter column admin_user_id drop not null;

alter table audit_logs
  add constraint audit_logs_actor_check check (
    (actor_type = 'admin' and admin_user_id is not null) or
    (actor_type = 'system' and admin_user_id is null)
  );
