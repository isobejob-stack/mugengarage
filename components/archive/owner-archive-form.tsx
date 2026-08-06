"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ownerArchiveEntryFormSchema,
  type OwnerArchiveEntryFormValues,
} from "@/lib/archive/schema";

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
    const res = await fetch(`/api/admin/owners-archive/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "保存に失敗しました");
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

      <Field label="オーナーコメント（将来公開予定、現時点では非表示）">
        <textarea rows={4} className="input" {...register("owner_comment")} />
      </Field>

      <label className="flex items-center gap-2 text-base font-medium">
        <input type="checkbox" {...register("is_published")} />
        アーカイブページで公開する
      </label>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto block min-h-11 w-full max-w-md rounded-md bg-blue-600 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "保存中..." : "更新する"}
        </button>
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
      <span className="text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
