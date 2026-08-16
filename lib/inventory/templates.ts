import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GradeTemplate } from "@/lib/inventory/types";

// FR-ADM-004 / FR-VEH-004: グレード別テンプレート。
//
// 車両を登録するときにグレードを選ぶと、未入力の「エンジンの特徴」「よくある故障」「維持費」に
// この文章が自動で入る（components/inventory/vehicle-form.tsx の applyGradeTemplate）。
// 同じグレードの個体を何台も扱う店なので、毎回同じ説明を書き直さずに済む仕組み。
//
// これまで grade_templates に読み書きする管理画面が無く、
// テンプレートを直すにはSQLを直接実行するしかなかった。

export const gradeTemplateFormSchema = z.object({
  grade_id: z.string().uuid("グレードを選択してください"),
  // 空欄は「テンプレート無し」。空文字のまま保存するとフォーム側の
  // 「未入力の項目にだけ自動入力する」判定が空文字を入れてしまうため、nullに寄せる。
  engine_features_template: z
    .string()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  common_issues_template: z
    .string()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  maintenance_cost_template: z
    .string()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
});

export type GradeTemplateFormValues = z.input<typeof gradeTemplateFormSchema>;

export type GradeTemplateListItem = GradeTemplate & {
  gradeName: string;
  /** メーカー › 車種 › シリーズ › 世代 › グレード。どのグレードか一意に分かるようにする */
  gradePath: string;
};

// 管理画面の一覧用。グレード名だけでは「XJの4.2」なのか「XKの4.2」なのか分からないため、
// 階層をたどった表示名を組み立てて返す。
export async function listGradeTemplates(): Promise<GradeTemplateListItem[]> {
  const supabase = createAdminClient();

  const [templates, grades] = await Promise.all([
    supabase.from("grade_templates").select("*"),
    supabase
      .from("grades")
      .select(
        "id, name, generations(name, series(name, models(name, manufacturers(name))))",
      )
      .is("deleted_at", null),
  ]);

  const pathByGradeId = new Map<string, { name: string; path: string }>();
  for (const row of (grades.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    generations: {
      name: string;
      series: {
        name: string;
        models: { name: string; manufacturers: { name: string } | null } | null;
      } | null;
    } | null;
  }>) {
    const parts = [
      row.generations?.series?.models?.manufacturers?.name,
      row.generations?.series?.models?.name,
      row.generations?.series?.name,
      row.generations?.name,
      row.name,
    ].filter(Boolean);
    pathByGradeId.set(row.id, { name: row.name, path: parts.join(" › ") });
  }

  return ((templates.data ?? []) as GradeTemplate[])
    .map((template) => ({
      ...template,
      gradeName: pathByGradeId.get(template.grade_id)?.name ?? "（削除済みグレード）",
      gradePath: pathByGradeId.get(template.grade_id)?.path ?? "（削除済みグレード）",
    }))
    .sort((a, b) => a.gradePath.localeCompare(b.gradePath, "ja"));
}

// テンプレートはグレードごとに1件（grade_id が UNIQUE）。
// 「新規作成」と「編集」を画面で作り分ける必要が無いので、常にupsertで扱う。
export async function upsertGradeTemplate(
  values: z.output<typeof gradeTemplateFormSchema>,
) {
  const supabase = createAdminClient();
  return supabase
    .from("grade_templates")
    .upsert(values, { onConflict: "grade_id" })
    .select()
    .single();
}

export async function deleteGradeTemplate(gradeId: string) {
  const supabase = createAdminClient();
  // grade_templates は履歴を残す必要がない補助データ（deleted_atカラムも持たない）ため、
  // BR-DEL-001の例外として物理削除する。消しても車両側の入力済みの文章は残る。
  return supabase.from("grade_templates").delete().eq("grade_id", gradeId);
}
