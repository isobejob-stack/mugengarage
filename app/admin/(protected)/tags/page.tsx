import { listTags } from "@/lib/tags/queries";
import { TagsManager } from "@/components/tags/tags-manager";

// SCR-ADM-024 ・ FR-INV-012 / FR-BLOG-002 ・ BR-DATA-003:
// タグマスタの一覧・新規追加・削除を行う管理画面
export default async function Page() {
  const tags = await listTags();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        タグ管理
      </h1>
      <p className="text-foreground-muted mt-2 text-base">
        SCR-ADM-024 ・ BR-DATA-003
      </p>
      <TagsManager initialTags={tags} />
    </main>
  );
}
