import { listGradeTemplates } from "@/lib/inventory/templates";
import { getVehicleHierarchyOptions } from "@/lib/inventory/queries";
import { GradeTemplatesManager } from "@/components/inventory/grade-templates-manager";

// SCR-ADM-022 ・ FR-ADM-004 / FR-VEH-004: グレード別テンプレート管理
//
// 車両登録でグレードを選ぶと、未入力の「エンジンの特徴」「よくある故障」「維持費」に
// ここで登録した文章が自動で入る。同じグレードの個体を何台も扱うため、
// 毎回同じ説明を書き直さずに済ませるための仕組み。
//
// 2026-08-17まで見出しだけの画面で、テンプレートを直すにはSQLを直接実行するしかなかった。
export default async function Page() {
  const [templates, options] = await Promise.all([
    listGradeTemplates(),
    getVehicleHierarchyOptions(),
  ]);

  // グレード名だけでは「XJの4.2」か「XKの4.2」か区別できないため、
  // 階層をたどった表示名を作る（一覧側と同じ形に揃える）。
  const gradeOptions = options.grades
    .map((grade) => {
      const generation = options.generations.find(
        (g) => g.id === grade.generation_id,
      );
      const series = options.series.find((s) => s.id === generation?.series_id);
      const model = options.models.find((m) => m.id === series?.model_id);
      const manufacturer = options.manufacturers.find(
        (m) => m.id === model?.manufacturer_id,
      );
      return {
        id: grade.id,
        path: [
          manufacturer?.name,
          model?.name,
          series?.name,
          generation?.name,
          grade.name,
        ]
          .filter(Boolean)
          .join(" › "),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path, "ja"));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        グレード別テンプレート管理
      </h1>
      <p className="text-foreground-muted mt-2 text-base leading-relaxed">
        車両を登録するときにグレードを選ぶと、ここで登録した文章が
        「エンジンの特徴」「よくある故障」「維持費」に自動で入ります。
        <br />
        すでに文章が入っている欄は上書きしません。登録後に車両ごとに書き換えても構いません。
      </p>

      <GradeTemplatesManager
        templates={templates}
        gradeOptions={gradeOptions}
      />
    </main>
  );
}
