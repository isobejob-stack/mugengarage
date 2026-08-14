// 全ドメイン共通のステータスバッジ（03_ui_rules.md 7章）。
// 色だけで情報を伝えないよう、色＋文字ラベルを必ず併記する。
const TONE_CLASSES = {
  neutral: "bg-neutral-100 text-neutral-700",
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
} as const;

export type StatusBadgeTone = keyof typeof TONE_CLASSES;

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

// 車両公開ステータス（05_glossary.md 4章）のラベル・トーン対応
import type { VehicleStatus } from "@/lib/inventory/types";

// 「削除済み車両」一覧のように、バッジではなくラベル文字列だけ欲しい場面向けにexportする
export const VEHICLE_STATUS_PRESET: Record<
  VehicleStatus,
  { label: string; tone: StatusBadgeTone }
> = {
  published: { label: "公開中", tone: "success" },
  draft: { label: "非公開", tone: "neutral" },
  sold: { label: "売約済", tone: "danger" },
  negotiating: { label: "商談中", tone: "warning" },
  coming_soon: { label: "Coming Soon", tone: "info" },
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const preset = VEHICLE_STATUS_PRESET[status];
  return <StatusBadge label={preset.label} tone={preset.tone} />;
}

// FR-INV-005（表示側）: 公開ページの車両カード写真上に重ねる「おすすめ／新着」表示。
// Cardはrelative指定済みのため、CardImageの直後にこのまま置けばオーバーレイになる。
export function VehicleFeatureBadges({
  isRecommended,
  isNewArrival,
}: {
  isRecommended: boolean;
  isNewArrival: boolean;
}) {
  if (!isRecommended && !isNewArrival) return null;
  return (
    <div className="absolute top-2 left-2 z-10 flex gap-1">
      {isRecommended && <StatusBadge label="おすすめ" tone="warning" />}
      {isNewArrival && <StatusBadge label="新着" tone="info" />}
    </div>
  );
}
