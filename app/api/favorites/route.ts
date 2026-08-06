import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionId } from "@/lib/engagement/session";
import { toggleFavorite } from "@/lib/engagement/queries";
import { apiError } from "@/lib/api/error-response";

const bodySchema = z.object({ vehicle_id: z.string().uuid() });

// FR-FAV-001: お気に入り登録・解除（匿名セッションIDベース、認証不要）
export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return apiError({
      code: "VALIDATION_ERROR",
      message:
        "セッションを確認できませんでした。ページを再読み込みしてください。",
    });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "車両IDが不正です",
      field: "vehicle_id",
    });
  }

  const favorited = await toggleFavorite(sessionId, parsed.data.vehicle_id);
  return NextResponse.json({ data: { favorited } });
}
