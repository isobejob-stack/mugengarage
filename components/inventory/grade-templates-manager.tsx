"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteJson, postJson } from "@/lib/api/client";
import type { GradeTemplateListItem } from "@/lib/inventory/templates";

// SCR-ADM-022 / FR-ADM-004: グレード別テンプレートの管理。
//
// テンプレートは「そのグレードなら毎回同じことを書く」文章の置き場所で、
// 車両登録でグレードを選ぶと、未入力の欄にだけ自動で入る。
// これまで管理画面が無く、直すにはSQLを実行するしかなかった。
//
// グレードは在庫マスタ全体では数が多いため、選択肢は
// 「メーカー › 車種 › シリーズ › 世代 › グレード」の形で出す。
// グレード名だけでは「XJの4.2」と「XKの4.2」が区別できない。

type GradeOption = { id: string; path: string };

type Draft = {
  grade_id: string;
  engine_features_template: string;
  common_issues_template: string;
  maintenance_cost_template: string;
};

const EMPTY_DRAFT: Draft = {
  grade_id: "",
  engine_features_template: "",
  common_issues_template: "",
  maintenance_cost_template: "",
};

export function GradeTemplatesManager({
  templates,
  gradeOptions,
}: {
  templates: GradeTemplateListItem[];
  gradeOptions: GradeOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GradeTemplateListItem | null>(
    null,
  );

  // 既にテンプレートがあるグレードを選んだら、その内容を読み込んで上書き編集にする。
  // 別レコードとして作れない（grade_idがUNIQUE）ので、
  // 「新規のつもりで書いたら保存時に上書きだった」という驚きを先に潰す。
  const selectGrade = (gradeId: string) => {
    const existing = templates.find((t) => t.grade_id === gradeId);
    setDraft({
      grade_id: gradeId,
      engine_features_template: existing?.engine_features_template ?? "",
      common_issues_template: existing?.common_issues_template ?? "",
      maintenance_cost_template: existing?.maintenance_cost_template ?? "",
    });
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    const result = await postJson("/api/admin/grade-templates", draft);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setDraft(EMPTY_DRAFT);
    router.refresh();
  };

  const remove = async (gradeId: string) => {
    setError(null);
    const result = await deleteJson(
      `/api/admin/grade-templates?grade_id=${encodeURIComponent(gradeId)}`,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  const isEditingExisting = templates.some(
    (t) => t.grade_id === draft.grade_id,
  );

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-charcoal-900 font-serif text-xl font-bold">
          {isEditingExisting ? "テンプレートを編集" : "テンプレートを追加"}
        </h2>

        <label className="mt-4 block">
          <span className="text-charcoal-900 text-base font-medium">
            グレード
          </span>
          <select
            className="input mt-1"
            value={draft.grade_id}
            onChange={(e) => selectGrade(e.target.value)}
          >
            <option value="">選択してください</option>
            {gradeOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.path}
              </option>
            ))}
          </select>
        </label>

        {isEditingExisting && (
          <p className="text-foreground-muted mt-2 text-base">
            このグレードには既にテンプレートがあります。保存すると上書きされます。
          </p>
        )}

        <TemplateField
          label="エンジンの特徴"
          value={draft.engine_features_template}
          onChange={(v) =>
            setDraft((d) => ({ ...d, engine_features_template: v }))
          }
        />
        <TemplateField
          label="よくある故障"
          value={draft.common_issues_template}
          onChange={(v) => setDraft((d) => ({ ...d, common_issues_template: v }))}
        />
        <TemplateField
          label="維持費"
          value={draft.maintenance_cost_template}
          onChange={(v) =>
            setDraft((d) => ({ ...d, maintenance_cost_template: v }))
          }
        />

        {error && (
          <p className="mt-3 text-base text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={saving || !draft.grade_id}
            onClick={() => void save()}
          >
            {saving ? "保存中..." : "保存する"}
          </Button>
          {draft.grade_id && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setDraft(EMPTY_DRAFT)}
            >
              入力を破棄
            </Button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-charcoal-900 font-serif text-xl font-bold">
          登録済みのテンプレート（{templates.length}件）
        </h2>

        {templates.length === 0 ? (
          <p className="text-foreground-muted mt-3 text-base">
            まだありません。よく扱うグレードから登録すると、
            車両登録のときに説明文が自動で入ります。
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {templates.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-charcoal-900 text-base font-medium">
                    {t.gradePath}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectGrade(t.grade_id)}
                    >
                      編集
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingDelete(t)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 flex flex-col gap-2">
                  <Preview label="エンジンの特徴" value={t.engine_features_template} />
                  <Preview label="よくある故障" value={t.common_issues_template} />
                  <Preview label="維持費" value={t.maintenance_cost_template} />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="テンプレートを削除します"
        description={`「${pendingDelete?.gradePath ?? ""}」のテンプレートを削除します。既に車両に入力済みの文章は残ります。`}
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const gradeId = pendingDelete?.grade_id;
          setPendingDelete(null);
          if (gradeId) void remove(gradeId);
        }}
      />
    </div>
  );
}

function TemplateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      <textarea
        rows={4}
        className="input mt-1"
        placeholder="空欄にすると、この項目は自動入力しません"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Preview({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-foreground-muted text-sm">{label}</dt>
      {/* 一覧では全文を出さない。3項目×件数分の本文が並ぶと、どのグレードの
          テンプレートがあるのかという一覧本来の役割が埋もれるため。 */}
      <dd className="text-charcoal-900 line-clamp-2 text-base">{value}</dd>
    </div>
  );
}
