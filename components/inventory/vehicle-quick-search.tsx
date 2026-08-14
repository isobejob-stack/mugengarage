import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SelectField,
  PRICE_OPTIONS,
} from "@/components/inventory/vehicle-search-fields";

// トップページから直接、在庫を絞り込んで探せるようにする。
//
// 従来はトップに検索の入口が無く、車を探すには
// 「在庫車両を見る」→ 一覧 → 絞り込みフォームを開く、という3手が必要だった。
// 中古車メディアはいずれもトップの一等地に検索ブロックを置いており、
// 「まず条件を入れる」という利用者の慣れた動き出しをそこで受け止めている。
//
// 項目は絞る。トップで全条件を出すと一覧の絞り込みと二重になり、
// どちらで探せばよいのか分からなくなる。最初に決まりやすい
// 「車種」と「予算」だけを置き、細かい条件は一覧側に任せる。
export function VehicleQuickSearch({
  models,
  totalCount,
}: {
  models: Array<{ id: string; name: string; count: number }>;
  totalCount: number;
}) {
  // よく使われる条件へのショートカット。
  // プルダウンを1つも操作せずに探し始められる入口を用意する
  // （中古車メディアの「人気の条件から探す」に相当）。
  const shortcuts = [
    { label: "車検整備付", href: "/vehicles?shaken=1" },
    { label: "修復歴なし", href: "/vehicles?no_accident=1" },
    { label: "200万円以下", href: "/vehicles?price_max=2000000" },
    { label: "新着順に見る", href: "/vehicles?sort=new" },
  ];

  return (
    <section
      aria-labelledby="quick-search-heading"
      className="shadow-medium rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
    >
      <h2
        id="quick-search-heading"
        className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl"
      >
        在庫から探す
      </h2>
      <p className="text-foreground-muted mt-1 text-base">
        現在{totalCount}台を掲載しています。条件を選んでお探しください。
      </p>

      <form
        method="get"
        action="/vehicles"
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <SelectField
          label="車種"
          name="model"
          options={models.map((m) => ({
            value: m.id,
            label: `${m.name}（${m.count}台）`,
          }))}
          placeholder="すべての車種"
        />
        <SelectField
          label="予算（車両本体価格の上限）"
          name="price_max"
          options={PRICE_OPTIONS}
          placeholder="上限なし"
        />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            この条件で在庫を見る
          </Button>
        </div>
      </form>

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <p className="text-charcoal-900 text-sm font-bold">よく使われる条件</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.href}>
              <Link
                href={shortcut.href}
                className="text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 inline-flex min-h-11 items-center rounded-full border border-neutral-300 px-4 text-sm transition-colors"
              >
                {shortcut.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
