import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";

// FR-INV-007: 車両の公開予約。status = 'draft' かつ scheduled_publish_at が現在時刻以前の
// 車両を 'published' に切り替える。
// FR-BLOG-004: 記事の公開予約。同様の条件の記事を 'published' に切り替え、
// 既存のPATCH /api/admin/articles/:id の公開時ロジック（app/api/admin/articles/[id]/route.ts）に
// 倣い、published_at も現在時刻をセットする。
//
// Vercel Cron Jobs（vercel.json）から呼び出されるバッチエンドポイント。
// 実行間隔は「1日1回（0 0 * * * ＝ 毎日09:00 JST）」。本来は公開予約の精度を上げるため毎時
// （0 * * * *）にしたいが、VercelのHobby（無料）プランは1日1回より高頻度のCronを許可しておらず、
// 毎時指定のままではデプロイ自体が「Hobby accounts are limited to daily cron jobs」で失敗し、
// Cronに限らず全ての更新が本番に反映されなくなる（2026-08-08にこの事象が発生していた）。
// Proプランへのアップグレード（docs/tasks/ISSUE-003、商用利用のため元々必須）の完了後は
// vercel.json のscheduleを "0 * * * *" に戻すこと。
//
// 第三者が呼び出せてしまうと不正にステータスが公開へ書き換えられてしまう。
// そのためVercel Cron Jobsの標準的な方式（Authorization: Bearer ${CRON_SECRET}）で
// リクエスト元を検証する（authentication.md 8章の「管理系APIはリクエストごとに検証する」思想を、
// 管理者セッションではなくCronの共有シークレットに置き換えて適用する）。
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError({
      code: "UNAUTHORIZED",
      message: "認証に失敗しました",
    });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // FR-INV-007: 公開予約日時を過ぎた下書き車両を公開に切り替える
  const { data: publishedVehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .update({ status: "published" })
    .eq("status", "draft")
    .not("scheduled_publish_at", "is", null)
    .lte("scheduled_publish_at", now)
    .is("deleted_at", null)
    .select("id");

  if (vehiclesError) {
    return apiInternalError(vehiclesError);
  }

  // FR-BLOG-004: 公開予約日時を過ぎた下書き記事を公開に切り替える
  const { data: publishedArticles, error: articlesError } = await supabase
    .from("articles")
    .update({ status: "published", published_at: now })
    .eq("status", "draft")
    .not("scheduled_publish_at", "is", null)
    .lte("scheduled_publish_at", now)
    .is("deleted_at", null)
    .select("id");

  if (articlesError) {
    return apiInternalError(articlesError);
  }

  // レビュー指摘対応（必須修正3, BR-HIST-002）: audit_logs.admin_user_id は元々
  // admin_users への NOT NULL 外部キーだったが、システムによる自動操作を記録できるよう
  // マイグレーション（20260806110000_add_actor_type_to_audit_logs.sql）でactor_typeカラムを
  // 追加し、actor_type = 'system' の場合はadmin_user_idをnull許容にした。
  // 「誰が・いつ・何を・どう変更したか」を記録するBR-HIST-002の趣旨に沿い、
  // 本バッチが公開に切り替えた車両・記事それぞれについてactor_type: "system"の監査ログを記録する。
  await Promise.all([
    ...(publishedVehicles ?? []).map((v) =>
      recordAuditLog({
        actorType: "system",
        targetType: "vehicle",
        targetId: v.id as string,
        action: "publish",
      }),
    ),
    ...(publishedArticles ?? []).map((a) =>
      recordAuditLog({
        actorType: "system",
        targetType: "article",
        targetId: a.id as string,
        action: "publish",
      }),
    ),
  ]);

  return NextResponse.json({
    data: {
      publishedVehicleCount: publishedVehicles?.length ?? 0,
      publishedVehicleIds: (publishedVehicles ?? []).map((v) => v.id as string),
      publishedArticleCount: publishedArticles?.length ?? 0,
      publishedArticleIds: (publishedArticles ?? []).map((a) => a.id as string),
    },
  });
}
