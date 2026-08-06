-- Inventory Context / 車両写真用Supabase Storageバケット
-- FR-INV-009（写真アップロード・管理）, system_architecture.md 4.4（Storage）
--
-- 車両情報自体が公開サイトの目玉であり、写真も公開情報のため、非公開バケット・署名付きURLに
-- する必要はない。public: true とし、表示側は getPublicUrl() で組み立てた公開URLをそのまま使う。
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true);

-- storage.objects はSupabase Storageの標準機能により初期状態でRLSが有効になっている。
-- 書き込み（アップロード・論理削除に伴うオブジェクトの扱い）は
-- app/api/admin/vehicles/[id]/photos/ 配下のRoute Handlerが createAdminClient()
-- （SUPABASE_SERVICE_ROLE_KEY、RLSをbypassする）経由でのみ行う。
-- 公開読み取りは public バケットの設定により、RLSポリシーの有無に関わらず公開URL経由で許可される。
-- テーブル単位のRLSポリシー設計は方針として持ち越しており（docs/tasks/ISSUE-002-rls-policies-undefined.md）、
-- storage.objectsについても同じ判断（匿名/authenticatedキーからの直接書き込みは
-- ポリシー無し＝拒否のまま多層防御として残す）を踏襲し、追加のポリシーは定義しない。
