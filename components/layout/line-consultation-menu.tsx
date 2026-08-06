import {
  LINE_CONSULTATION_CATEGORIES,
  buildLineConsultationUrl,
} from "@/lib/site-config";

// FR-LINE-002: 相談カテゴリ表示。購入／修理／売却／部品／Jaguar全般／カーライフ相談の
// 6カテゴリを訴求し、タップすると各カテゴリの事前入力テキスト付きLINEリンクへ遷移する（FR-LINE-003）。
// 03_ui_rules.md 4章: タップ対象は最低44px四方のタップ領域（min-h-11 = 44px）を確保する。
export function LineConsultationMenu() {
  return (
    <section aria-labelledby="line-consultation-menu-heading">
      <h2 id="line-consultation-menu-heading" className="text-lg font-bold">
        カテゴリから相談する
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        ご相談内容に近いカテゴリをお選びください。
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LINE_CONSULTATION_CATEGORIES.map((category) => (
          <li key={category.id}>
            <a
              href={buildLineConsultationUrl(category.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center rounded-md border border-l-4 border-neutral-300 border-l-green-600 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 hover:border-green-600 hover:bg-green-50"
            >
              {category.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
