-- ISSUE-004課題1 / BR-HIST-002: 論理削除の復元（restore）機能を追加したが、
-- audit_logs.actionのCHECK制約に'restore'が含まれておらず、復元のたびに
-- INSERTがCHECK違反でサイレントに失敗していた（recordAuditLogがinsertの
-- エラーを見ていないため画面上は正常に見える）。開発部長レビューで発覚。
alter table audit_logs
  drop constraint audit_logs_action_check,
  add constraint audit_logs_action_check check (
    action in ('create', 'update', 'delete', 'publish', 'unpublish', 'restore')
  );
