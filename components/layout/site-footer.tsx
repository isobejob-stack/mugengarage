import Link from "next/link";
import { LINE_URL } from "@/lib/site-config";

// 03_ui_rules.md 7章: フッターでもLINE相談CTAを再掲する
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900">エムガレージ</p>
        <p className="mt-1">クラシックJaguar専門店</p>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/about" className="hover:underline">
            店舗情報・アクセス
          </Link>
          <Link href="/contact" className="hover:underline">
            お問い合わせ
          </Link>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-700 hover:underline"
          >
            LINEで相談する
          </a>
        </div>
      </div>
    </footer>
  );
}
