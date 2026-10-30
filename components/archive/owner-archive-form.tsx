"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ownerArchiveEntryFormSchema,
  type OwnerArchiveEntryFormValues,
} from "@/lib/archive/schema";
import { Button } from "@/components/ui/button";
import { patchJson } from "@/lib/api/client";

// SCR-ADM-019: オーナーズアーカイブ編集フォーム
export function OwnerArchiveForm({
  vehicleId,
  defaultValues,
}: {
  vehicleId: string;
  defaultValues: OwnerArchiveEntryFormValues;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<OwnerArchiveEntryFormValues>({
    resolver: zodResolver(ownerArchiveEntryFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: OwnerArchiveEntryFormValues) => {
    setSubmitError(null);
    const result = await patchJson(
      `/api/admin/owners-archive/${vehicleId}`,
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/admin/vehicles");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 pb-24"
    >
      <Field label="レストア履歴（Markdown、任意）">
        <textarea
          rows={8}
          className="input"
          {...register("restoration_history")}
        />
      </Field>

      <Field label="販売履歴（Markdown、任意）">
        <textarea rows={8} className="input" {...register("sales_history")} />
      </Field>

      {/* FR-OWN-004: 公開画面に「オーナーの声」として表示する。
          本人の許可を得た内容だけを入力する運用（BR-CONTENT-003）を、入力欄の真下で伝える。 */}
      <Field label="オーナーの声（Markdown、任意）">
        <textarea rows={4} className="input" {...register("owner_comment")} />
        <span className="text-foreground-muted mt-1 block text-sm">
          入力すると、公開画面に「オーナーの声」として表示されます。オーナーご本人の許可を得た言葉だけを入れてください。インタビュー動画は、車両の編集画面で動画として登録すると、このページの写真と一緒に表示されます。
        </span>
      </Field>

      <label className="text-charcoal-900 flex min-h-11 items-center gap-2 text-base font-medium">
        <input
          type="checkbox"
          className="accent-primary-600 h-5 w-5"
          {...register("is_published")}
        />
        アーカイブページで公開する
      </label>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <div className="shadow-medium fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="mx-auto w-full max-w-md justify-center"
        >
          {isSubmitting ? "保存中..." : "更新する"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
